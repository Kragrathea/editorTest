import * as THREE from 'three';
import { AddObjectCommand } from './commands/AddObjectCommand.js';
import { Command } from './Command.js';
import { Line2 } from '/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/examples/jsm/lines/LineMaterial.js';  
import { LineGeometry } from '/examples/jsm/lines/LineGeometry.js';
import { Vector3 } from '../../src/math/Vector3.js';
import { SelectTool } from './SelectTool.js';


class ToolManager{

	constructor(editor) {
		this.editor=editor;
		activeTool=null;
		
		editor.signals.toolChanged.add( function (name) {
			console.log("ToolManager.toolChanged")

			// if(this.activeTool)
			// 	this.activeTool.cancel();
			// this.activeTool=newTool;
			// this.activeTool.activate();
		} );
	}

}

class Entity{
	static byId={}//should be weak set
	constructor() {
		this.id=THREE.MathUtils.generateUUID();
		Entity.byId[this.id]=this;
	}
}
class Vertex extends Entity{
	//edges()
	//faces()
	//loops()
	//position=new THREE.Vector3;
	constructor(position) {
		//use weakset?
		super()//important
		this.connectionIds=new Set()//Entity ids
		this.position=position;
		this.type="Vertex"
		//console.log(["byId",Entity.byId])
	}
	connect(otherEntity)
	{
		//todo should only be edge?
		//this.connections.add(otherEntity);
		this.connectionIds.add(otherEntity.id);
	}
	disconnect(otherEntity)
	{
		//todo should only be edge?
		this.connectionIds.delete(otherEntity.id); 
	}
	allEdges()
	{
		//let edges=[]
		let edges=Array.from(this.connectionIds).map(v=>Entity.byId[v])

		return edges

	}
	updateRenderObjects()
	{
		this.allEdges().forEach((edge)=>{
			edge.updateRenderObject();
		})
	}	
	toJSON()
	{
		// let connectionIds=[]
		// this.connections.forEach((connection)=>{
		// 	connectionIds.push(connection.id)
		// })
		let data={
			id:this.id,
			position:this.position,
			connectionIds:connectionIds
		}	
		return data;	
	}
	fromJSON(json)
	{
		if(Entity.byId[json.id])
			return Entity.byId[json.id]
		else{
			this.id=json.id;
			this.position= new Vector3(json.position.x,json.position.y,json.position.z);
		}
	}
	copy(){	}
	
}
class Selection{
	constructor(view)
	{
		//VIEW may not be fully ready at this point.

		this.selected=new Set();
	}
	add(ent)
	{
		this.selected.add(ent)
		if(ent.doSelect)
			ent.doSelect();
	}
	remove(ent)
	{
		this.selected.delete(ent)
		if(ent.doUnselect)
			ent.doUnselect()
	}	
	toggle(ent)
	{
		if(this.selected.has(ent))
			this.remove(ent)
		else
			this.add(ent)
	}
	clear()
	{
		this.selected.forEach((ent)=>{
			ent.doUnselect();
		})
		this.selected.clear();
	}
	toJSON()
	{
		return JSON.stringify(Array.from(this.selected))

	}
}
class Model{
	constructor()
	{
		this.entities=new Entities();
	}
	toJSON()
	{
		return {
			entities:this.entities
		}
	}
	fromJSON(json)
	{
		this.entities=new Entities();
	}
}
class MoveEntitesCommand extends Command {

	constructor( editor, entities, vector ) {

		super( editor );
		this.type = 'MoveEntitesCommand';
		this.name = 'Move Entites';
		this.updatable = false;
		//this.object = object;
		this.entities= entities;
		this.vector=vector;
	}

	execute() {
		this.allVerts={}
		this.entities.forEach(ent=>{
			if(ent.type=="Edge")
			{
				this.allVerts[ent.start.id]=ent.start;
				this.allVerts[ent.end.id]=ent.end;
			}
		})
		Object.values(this.allVerts).forEach(vert=>{
			vert.position.add(this.vector);
			vert.updateRenderObjects();
		})

		//this.editor.model.edges
		// if(this.editor.model.entities.edges[this.edge.id])
		// 	this.editor.model.entities.edges[this.edge.id]=null;//TODO. MUCH MORE to do here!!

		// window.editor.model.entities.inferSet.removeEdgeRef(this.edge);


		// this.object.position.copy( this.newPosition );
		// this.object.updateMatrixWorld( true );
		// this.editor.signals.objectChanged.dispatch( this.object );
	}

	undo() {
		Object.values(this.allVerts).forEach(vert=>{
			vert.position.add(this.vector.clone().negate());
			vert.updateRenderObjects();
		})
	}
	// update( command ) {
	// 	this.newPosition.copy( command.newPosition );
	// }
	toJSON() {
		alert("Command.toJSON called")
		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );
	}

}
class SplitEdgeCommand extends Command {

	constructor( editor, edge, splitPoint ) {

		super( editor );
		this.type = 'SplitEdgeCommand';
		this.name = 'Split Edge';
		this.updatable = false;
		this.splitPoint=splitPoint;
		//this.object = object;
		this.edge= edge;
	}

	execute() {
		console.log("do split")
		//this.editor.model.edges
		let newVert = new Vertex(this.splitPoint)
		this.newVert=newVert;

		let newEdge= new Edge(newVert,this.edge.end)

		this.edge.end.disconnect(this.edge)//remove this edge from v2 connections

		this.edge.end=newVert//new vert should already be connected right?
		newVert.connect(this.edge);

		window.editor.model.entities.edges[newEdge.id]=newEdge;
		
		this.newEdge=newEdge;
		window.editor.view.render()

		window.editor.model.entities.inferSet.addEdgeRef(this.newEdge);
		//window.editor.model.entities.inferHelpers.addEdge(newEdge);
		//window.editor.execute( new AddObjectCommand(window.editor, newEdge.renderObject ) );		
				

	}

	undo() {
		console.log("undo split")

		this.edge.end=this.newEdge.end
		this.edge.end.connect(this.edge)

		this.newEdge.end.disconnect(this.newEdge)
		this.newEdge.start.disconnect(this.newEdge)
		//this.newEdge.renderObject.dispose()
		this.newEdge.renderObject=null;

		this.edge.updateRenderObject();

		if(this.editor.model.entities.edges[this.newEdge.id])
			this.editor.model.entities.edges[this.newEdge.id]=null;

		window.editor.model.entities.inferSet.removeEdgeRef(this.newEdge);

		window.editor.view.render()
	
	}
	// update( command ) {
	// 	this.newPosition.copy( command.newPosition );
	// }
	toJSON() {
		alert("Command.toJSON called")
		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );
	}

}

class RemoveEdgeCommand extends Command {

	constructor( editor, edge ) {

		super( editor );
		this.type = 'RemoveEdgeCommand';
		this.name = 'Remove Edge';
		this.updatable = false;
		//this.object = object;
		this.edge= edge;
	}

	execute() {
		//this.editor.model.edges
		if(this.editor.model.entities.edges[this.edge.id])
			this.editor.model.entities.edges[this.edge.id]=null;//TODO. MUCH MORE to do here!!

		window.editor.model.entities.inferSet.removeEdgeRef(this.edge);


		// this.object.position.copy( this.newPosition );
		// this.object.updateMatrixWorld( true );
		// this.editor.signals.objectChanged.dispatch( this.object );
	}

	undo() {

		this.editor.model.entities.edges[this.edge.id]=this.edge;
		window.editor.model.entities.inferSet.addEdgeRef(this.edge);
	}
	// update( command ) {
	// 	this.newPosition.copy( command.newPosition );
	// }
	toJSON() {
		alert("Command.toJSON called")
		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );
	}

}

class AddEdgeCommand extends Command {

	constructor( editor, edge ) {

		super( editor );
		this.type = 'AddEdgeCommand';
		this.name = 'Add Edge';
		this.updatable = false;
		//this.object = object;
		this.edge= edge;
		// if ( object !== undefined && newPosition !== undefined ) {
		// 	this.oldPosition = object.position.clone();
		// 	this.newPosition = newPosition.clone();
		// }
	}

	execute() {
		console.log("do "+this.type)
		//this.editor.model.edges
		this.editor.model.entities.edges[this.edge.id]=this.edge;
		window.editor.model.entities.inferSet.addEdgeRef(this.edge);
		window.editor.view.render()
		// this.object.position.copy( this.newPosition );
		// this.object.updateMatrixWorld( true );
		// this.editor.signals.objectChanged.dispatch( this.object );
	}

	undo() {
		console.log("undo "+this.type)
		if(this.editor.model.entities.edges[this.edge.id])
			this.editor.model.entities.edges[this.edge.id]=null;
			
		window.editor.model.entities.inferSet.removeEdgeRef(this.edge);
	
		window.editor.view.render()	
		// this.object.position.copy( this.oldPosition );
		// this.object.updateMatrixWorld( true );
		// this.editor.signals.objectChanged.dispatch( this.object );
	}
	// update( command ) {
	// 	this.newPosition.copy( command.newPosition );
	// }
	toJSON() {
		console.log("*************AddEdgeCommand.toJSON called")
		const output = super.toJSON( this );
		// output.objectUuid = this.object.uuid;
		// output.oldPosition = this.oldPosition.toArray();
		// output.newPosition = this.newPosition.toArray();
		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );
		// this.object = this.editor.objectByUuid( json.objectUuid );
		// this.oldPosition = new Vector3().fromArray( json.oldPosition );
		// this.newPosition = new Vector3().fromArray( json.newPosition );
	}

}

class Entities{ 
	constructor()
	{
		this.edges={};
		this.edgesList=new EdgeList(1000);
		// this.edgesList.add(new Vector3(),new Vector3(0,1,1));
		// this.edgesList.add(new Vector3(),new Vector3(2,-1,0));
		// this.edgesList.add(new Vector3(),new Vector3(2,-1,2));
		// this.edgesList.setColor(1,new THREE.Color(0,1,0))
		// this.edgesList.setColor(2,new THREE.Color(1,0,0))
		// this.edgesList.add(new Vector3(),new Vector3(2,2,2));
		//this.inferHelpers=new InferHelpers();
		this.inferSet= new InferSet();
	}
	toJSON()
	{
		return {
			edges:this.edges
		};
	}
	render(renderer,camera)
	{
		//TODO: Find a better place for this!
		edgeMaterial.resolution.set(editor.view.container.dom.offsetWidth, editor.view.container.dom.offsetHeight);	
		selectedEdgeMaterial.resolution.set(editor.view.container.dom.offsetWidth, editor.view.container.dom.offsetHeight);				
		//TODO: Find a better place for this!

		Object.values(this.edges).forEach(edge => {
			if(edge && edge.renderObject)
			{
				renderer.render(edge.renderObject, camera )
			}
		  })


		//this.inferHelpers.render(renderer,camera);
		this.inferSet.render(renderer,camera);
		this.edgesList.render(renderer,camera)
	}
	findEdge(id)
	{
		return(this.edges[id]);
	}

	

	//todo: undo/redo. Cases add/remove edge, split edge, move verts (and/or edge?)
	addEdge(startPos,endPos){
		
		//find intersections
		let allIntersect=[]
		let ray=new THREE.Ray(startPos.clone(),endPos.clone().sub(startPos).normalize())
		for (var key in this.edges){
			let edge =this.edges[key];
			if(edge==null)
				continue;

			let a=new THREE.Vector3();
			let b=new THREE.Vector3();
			
			let intersect=ray.distanceSqToSegment(edge.start.position.clone(),edge.end.position.clone(),a,b)
			if(intersect<0.00001)
			{
				let rayDist=startPos.distanceTo(a)
				if(rayDist>startPos.distanceTo(endPos))//past end of new seg?
					continue;

				allIntersect.push([rayDist,edge,a.clone(),b.clone()])
				if(rayDist<0.00001){
					console.log("Cross At startPoint:"+[a,b])
					//newStartVert=edges.start

				}
				else if(endPos.distanceTo(a)<0.00001){
					console.log("Cross At endPoint:"+[a,b])
				}
				else if(startPos.distanceTo(a)<startPos.distanceTo(endPos)){	
					console.log("Cross At:"+[a,b])
				}
				//console.log("Intersect:"+[intersect,a,b])
			}
			//console.log();
		}

		let newVerts=[]
		let sorted=allIntersect.sort((a, b) => { return a[0]-b[0] } )
		
		let newEdges=[new Vertex(startPos)]
		//build new verts/edges from intersection points
		//store newVertex in intersects?
		//todo check for degenerage cases

		//foreach intersect
		//intersectEdge.split(intersectNewVertex)//in theory returns new edge/vertex. do we need?

		if(sorted.length)
		{
			console.log( startPos.distanceTo(sorted[0][2]))
			console.log( startPos.distanceTo(sorted[0][2])<0.00001)
			console.log(sorted.length==0 || startPos.distanceTo(sorted[0][2])<0.00001 )
		}
		if(sorted.length==0 || startPos.distanceTo(sorted[0][2])>0.00001 )
		{
			newVerts.push(new Vertex(startPos));
		}
		sorted.forEach((intersect)=>{
			let edge=intersect[1]
			//let newVert=edge.split(intersect[3])
			//newVerts.push(newVert)
			edge.split(intersect[3])

			newVerts.push(new Vertex(intersect[3]))
			//newVerts.push(edge.end)
			
		});
		newVerts.push(new Vertex(endPos));
		for(var i=0;i<newVerts.length-1;i++)
		{
			let newEdge = new Edge(newVerts[i],newVerts[i+1])

//window.editor.model.entities.edges[newEdge.id]=newEdge;
//window.editor.model.entities.inferHelpers.addEdge(newEdge);

//window.editor.model.entities.inferSet.addLine(newVerts[i].position,newVerts[i+1].position);
//window.editor.model.entities.inferSet.addAxis(newVerts[i].position);
//window.editor.model.entities.inferSet.addAxis(newVerts[i+1].position);

//window.editor.model.entities.inferSet.addEdgeRef(newEdge);

window.editor.execute( new AddEdgeCommand(window.editor, newEdge ) );		
				
		}

		console.log("newVerts")
		console.log(newVerts)

		return// edge;

		//from array of points

		//clip lines against existing
		//foreach edges in entities
		//if ent.distance(edge) <threshold
			//if colinear
				//merge
			//todo check not just ends same.
			//todo handl co-linear
			//preSplitEdges.push(ent)//needed?
			//newSplitEdges.push(ent.split(intersection))
			//newEdges.push(edge.split(intersection)
		//prepend edge
		//
		//Check added edges to see if faces need to be created
		//
		// find loops


		//_entities.push(newEdges)
	}
}
const edgeMaterial = new LineMaterial( {

	color: 0x000000,
	linewidth: 2, // in pixels
	vertexColors: false,
	//resolution:  // to be set by renderer, eventually
	//dashed: false,
	//alphaToCoverage: true,
	// onBeforeCompile: shader => {
	// 	shader.vertexShader = `
	// 	${shader.vertexShader}
	// 	`.replace(`uniform float linewidth;`, `attribute float linewidth;`);
	// 	//console.log(shader.vertexShader)
	// }

} );
const selectedEdgeMaterial = new LineMaterial( {

	color: 0x0000ff,
	linewidth: 2, // in pixels
	vertexColors: false,
	//resolution:  // to be set by renderer, eventually
	//dashed: false,
	//alphaToCoverage: true,
	// onBeforeCompile: shader => {
	// 	shader.vertexShader = `
	// 	${shader.vertexShader}
	// 	`.replace(`uniform float linewidth;`, `attribute float linewidth;`);
	// 	//console.log(shader.vertexShader)
	// }

} );
const edgeListMaterial = new LineMaterial( {

	//color: 0x000000,
	linewidth: 1, // in pixels
	vertexColors: true,
	//resolution:  // to be set by renderer, eventually
	//dashed: false,
	//alphaToCoverage: true,
	// onBeforeCompile: shader => {
	// 	shader.vertexShader = `
	// 	${shader.vertexShader}
	// 	`.replace(`uniform float linewidth;`, `attribute float linewidth;`);
	// 	//console.log(shader.vertexShader)
	// }

} );
class EdgeList{
	constructor(initialSize=1000)
	{
		const edgeVerts=new Array(initialSize*2*3).fill(0.0);//fill size * 2 verts * 3 floats
		// [
		//	vertex1.position.x,vertex1.position.y,vertex1.position.z,
		//	vertex2.position.x,vertex2.position.y,vertex2.position.z
		//];
		//edgeVerts[0]=1.0;
		const edgeGeometry = new LineGeometry();
		edgeGeometry.setPositions( edgeVerts );
		const edgeColors=new Array(initialSize*2*3).fill(0);//fill size * 2 verts * 3 int(?)
		const lineWidths=new Array(initialSize).fill(3)
		edgeGeometry.setColors( edgeColors );
		edgeGeometry.setAttribute("linewidth", new THREE.InstancedBufferAttribute(new Float32Array(lineWidths), 1));

		edgeGeometry.maxInstancedCount = 0;

		edgeGeometry.needsUpdate=true;

		const edge = new Line2( edgeGeometry,  edgeListMaterial );
		edge.computeLineDistances();
		edge.scale.set( 1, 1, 1 );
		edge.name="EdgeList";
		//edge.userData.edgeId=this.id
		this.renderObject=edge;
	}
	setColor(index,color)
	{
		let offset=index*3*2
		this.renderObject.geometry.attributes.instanceColorStart.array[offset+0]=color.r*255;
		this.renderObject.geometry.attributes.instanceColorStart.array[offset+1]=color.g*255;
		this.renderObject.geometry.attributes.instanceColorStart.array[offset+2]=color.b*255;
	}
	add(start,end){
		let index= this.renderObject.geometry.maxInstancedCount*3*2
		this.renderObject.geometry.attributes.instanceStart.array[index+0]=start.x;
		this.renderObject.geometry.attributes.instanceStart.array[index+1]=start.y;
		this.renderObject.geometry.attributes.instanceStart.array[index+2]=start.z;
		this.renderObject.geometry.attributes.instanceStart.array[index+3]=end.x;
		this.renderObject.geometry.attributes.instanceStart.array[index+4]=end.y;
		this.renderObject.geometry.attributes.instanceStart.array[index+5]=end.z;
		// this.renderObject.geometry.attributes.instanceEnd.array[index+0]=start.x;
		// this.renderObject.geometry.attributes.instanceEnd.array[index+1]=start.y;
		// this.renderObject.geometry.attributes.instanceEnd.array[index+2]=start.z;
		// this.renderObject.geometry.attributes.instanceEnd.array[index+3]=end.x;
		// this.renderObject.geometry.attributes.instanceEnd.array[index+4]=end.y;
		// this.renderObject.geometry.attributes.instanceEnd.array[index+5]=end.z;
		this.renderObject.geometry.maxInstancedCount=this.renderObject.geometry.maxInstancedCount+1;
		this.renderObject.computeLineDistances();
		this.renderObject.scale.set( 1, 1, 1 );

		this.renderObject.geometry.needsUpdate=true;
		this.renderObject.geometry.attributes.instanceStart.needsUpdate=true;
		this.renderObject.geometry.attributes.instanceEnd.needsUpdate=true;
		setTimeout(() => { 
			//this.renderObject.geometry.attributes.instanceEnd.setY(0, 0.5); 
			//this.renderObject.geometry.attributes.instanceStart.setY(1, 0.5); 
			//geometry.attributes.instanceEnd.setX(0, 0.5); 
			//geometry.attributes.instanceStart.setX(1, 0.5); 
			//this.renderObject.geometry.attributes.instanceStart.needsUpdate = true 
			//this.renderObject.geometry.attributes.instanceEnd.needsUpdate = true 
		}, 500)

	}
	render(renderer,camera)
	{
		edgeListMaterial.resolution.set(editor.view.container.dom.offsetWidth, editor.view.container.dom.offsetHeight);		

		renderer.render(this.renderObject, camera )
	}	
	
}

class Edge extends Entity{
	//vertices=[ new THREE.Vertex(), new THREE.Vertex()];
	constructor(vertex1,vertex2) {
		super()
		this.type="Edge"
		//this.vertices=[vertex1,vertex2]
		this.start=vertex1
		this.end=vertex2
		//connect the verts to this edge.
		vertex1.connect(this)
		vertex2.connect(this)

		this.createRenderObject();

	}
	createRenderObject()
	{
		const edgeVerts= [
			this.start.position.x,this.start.position.y,this.start.position.z,
			this.end.position.x,this.end.position.y,this.end.position.z
		];
		const edgeGeometry = new LineGeometry();
		edgeGeometry.setPositions( edgeVerts );
		let clr=[0,0,128,0,0,128]
		let lineWidths=[1]
		edgeGeometry.setColors( clr );
		edgeGeometry.setAttribute("linewidth", new THREE.InstancedBufferAttribute(new Float32Array(lineWidths), 1));

		edgeGeometry.needsUpdate=true;

		var edge = new Line2( edgeGeometry,  edgeMaterial );
		edge.computeLineDistances();
		edge.scale.set( 1, 1, 1 );
		edge.name="Edge";
		edge.userData.edgeId=this.id
		this.renderObject=edge;
	}
	updateRenderObject()
	{
		if(this.renderObject && this.renderObject.geometry)
		{
			this.renderObject.geometry.attributes.instanceStart.array[0]=this.start.position.x;
			this.renderObject.geometry.attributes.instanceStart.array[1]=this.start.position.y;
			this.renderObject.geometry.attributes.instanceStart.array[2]=this.start.position.z;

			this.renderObject.geometry.attributes.instanceStart.array[3]=this.end.position.x;
			this.renderObject.geometry.attributes.instanceStart.array[4]=this.end.position.y;
			this.renderObject.geometry.attributes.instanceStart.array[5]=this.end.position.z;
			this.renderObject.geometry.needsUpdate=true;
			this.renderObject.geometry.attributes.instanceStart.needsUpdate=true;
			this.renderObject.geometry.attributes.instanceEnd.needsUpdate=true;
			this.renderObject.geometry.computeBoundingBox();
			setTimeout(() => { 
				//this.renderObject.geometry.attributes.instanceEnd.setY(0, 0.5); 
				//this.renderObject.geometry.attributes.instanceStart.setY(1, 0.5); 
				//geometry.attributes.instanceEnd.setX(0, 0.5); 
				//geometry.attributes.instanceStart.setX(1, 0.5); 
				//this.renderObject.geometry.attributes.instanceStart.needsUpdate = true 
				//this.renderObject.geometry.attributes.instanceEnd.needsUpdate = true 
				//window.editor.view.render()
			}, 100)
				
		}
	}
	toJSON(){
		let data={
			type:this.type,
			id:this.id,
			start:this.start,
			end:this.end
		}
		return data;
	}
	fromJSON(json)
	{
		this.type=data.type;
		this.id=data.id;
		let start = data.start
		this.type=data.type;
		this.type=data.type;

	}
	doSelect()
	{
		if(this.renderObject)
			this.renderObject.material=selectedEdgeMaterial;
	}
	doUnselect()
	{
		if(this.renderObject)
			this.renderObject.material=edgeMaterial;
	}	
	allConnected()
	{
		//walk verts to get edges
	}

	otherVertex(vertex)
	{
		if(vertex==this.start)
			return this.end
		if(vertex==this.end)
			return this.start
		return null;//not found
	}

	split(splitPoint)
	{
		//make sure point is on line
		//newEdge.copy(this)
		//console.log("splitDist start:"+splitPoint.distanceTo(this.start.position))
		if(splitPoint.distanceTo(this.start.position)<0.000001)
		{
			console.log("Merge Start")
			return this.start
		}
		if(splitPoint.distanceTo(this.end.position)<0.000001)
		{
			console.log("Merge End")
			return this.end
		}

window.editor.execute( new SplitEdgeCommand(window.editor, this, splitPoint ) );		

// 		let newVert = new Vertex(splitPoint)

// 		let newEdge= new Edge(newVert,this.end)

// window.editor.model.entities.edges[newEdge.id]=newEdge;
// //window.editor.model.entities.inferHelpers.addEdge(newEdge);
// //window.editor.execute( new AddObjectCommand(window.editor, newEdge.renderObject ) );		
// 		this.end.disconnect(this)//remove this edge from v2 connections

// 		this.end=newVert//new vert should already be connected right?
// 		newVert.connect(this);

		this.updateRenderObject();

		//return newVert
	}
	splitDist(dist){}
	commonFace(otherEdge)
	{}
	curve(){}
	explodeCurve(){}
	faces(){}
	findFaces(){}
	//isUsedBy(element)
	//end(){}
	//start(){}
	//length(){}
	//toLine(){}
	//otherVertex(vertex){}
	//isReversedIn(face){}
	//smooth()
	//soft()	

}

window.testEdge = new Edge(new Vertex(new THREE.Vector3(0,1,0)),new Vertex(new THREE.Vector3(0,1,0)))

class InputPoint{
	constructor(  ) {
		this.raycaster = new THREE.Raycaster();//todo. reuse this?
		this.raycaster.params.Line2={threshold :10};

		this.lastInferLine=null;	//used for constraints
	}

	mouse = new THREE.Vector2();
	inPos = new THREE.Vector2();

	
	groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0));//todo. this should be somewhere else.

	intersectingObjects=[];

	viewCursorInferString="Nothing";
	viewCursorValid=false;
	clear()
	{
		this.viewCursorInferString="Nothing";
		this.viewCursorValid=false;
		this.intersectingObjects=[];
	}
	copy(source)
	{
		this.viewCursor.position.copy(source.viewCursor.position);
		this.viewCursor.viewCursorValid=source.viewCursor.viewCursorValid;
		this.viewCursor.viewCursorInferString=source.viewCursor.viewCursorInferString;

	}

	lockInfer()
	{
		if(this.lastInferLine)
		{
			this.lockedInferLine=new THREE.Line3(this.lastInferLine[0].clone(),this.lastInferLine[1].clone());
			console.log("LockingInferTo:"+JSON.stringify(this.lockedInferLine))
		}
	}
	unlockInfer()
	{
		this.lockedInferLine=null;
	}	
	debugAxis = new THREE.AxesHelper( 1.1 )
	viewCursor = this.debugAxis
	pick(view,x,y){
		//figure out what is under x,y

		this.inPos.fromArray( [x,y] );

		//var objects = view.editor.scene.children;
		//var intersects = view.getIntersects( this.inPos, objects );

		const objects = [];
		view.scene.traverseVisible( function ( child ) {
			objects.push( child );
		} );
		
		
		Object.values(view.model.entities.edges).forEach(edge => {
			if(edge && edge.renderObject)
			{
				objects.push( edge.renderObject );
			}
		  })

		this.mouse.set( ( this.inPos.x * 2 ) - 1, - ( this.inPos.y * 2 ) + 1 );
		this.raycaster.setFromCamera( this.mouse, view.camera );
		this.raycaster.params.Line = { threshold: 0.1 };//why is this diff from line2?
		this.raycaster.params.Line2 = { threshold: 10 };

		var intersects =this.raycaster.intersectObjects( objects, false );

		this.intersectingObjects=intersects;

		//console.log("scene:children:"+[scene,objects])

		var pointThreshold = 0.03;
		var edgeThreshold = 0.03;

		//cursor pos in screen space. 
		var curPos=this.raycaster.ray.at(1.0,new THREE.Vector3(0, 0, - 1)).project(view.camera);
		
		this.viewCursorInferString="Nothing";
		this.viewCursorValid=false;
		this.lastInferLine=null;	//used for constraints

	
		//default to ground if over
		var point = this.raycaster.ray.intersectPlane(this.groundPlane,new THREE.Vector3(0, 0, - 1));
		if(point!==null){
			this.viewCursor.position.set( point.x,point.y,point.z );
			this.viewCursorInferString="On Ground";					
			this.viewCursorValid=true;
		}
		
		if ( intersects.length > 0 ) {
			var curDist=edgeThreshold; //start at threshhold.
			this.viewCursorInferString= " ";

			//for (var i = 0, len = intersects.length; i < len; i++) {
			for (var i = intersects.length-1;i >=0 ; i--) {//go back to front.
				var intersect = intersects[ i ];

				if(intersect.object.name=="Edge")
				{
					//screen dist to edge.
					var screenDist = curPos.distanceTo( intersect.point.clone().project(view.camera));
					
					if(screenDist<curDist)//closer previous edges.
					{
						curDist=screenDist;
						var v0=new THREE.Vector3(intersect.object.geometry.attributes.instanceStart.array[0],
							intersect.object.geometry.attributes.instanceStart.array[1],
							intersect.object.geometry.attributes.instanceStart.array[2]);
						//console.log("v0:"+JSON.stringify(v0))
						var v1=new THREE.Vector3(intersect.object.geometry.attributes.instanceStart.array[3],
							intersect.object.geometry.attributes.instanceStart.array[4],
							intersect.object.geometry.attributes.instanceStart.array[5]);
						//console.log("v0 dist:"+curPos.distanceTo( v0.clone().project(view.camera)))
						if( curPos.distanceTo( v0.clone().project(view.camera))<pointThreshold){
							this.viewCursorInferString="On Endpoint";			
							this.viewCursor.position.copy(v0);
							this.viewCursorValid=true;							
						}else if( curPos.distanceTo( v1.clone().project(view.camera))<pointThreshold){
							this.viewCursorInferString="On Endpoint";			
							this.viewCursor.position.copy(v1);
							this.viewCursorValid=true;							
						}else {
							this.viewCursorInferString="On Edge";
							this.viewCursor.position.copy( intersect.pointOnLine );
							this.lastInferLine=[v0.clone(),v1.clone()]
							this.viewCursorValid=true;							
						}						
					}
				}
				else{
					this.viewCursorInferString="On Object "+intersect.object.name;		
					this.viewCursor.position.copy( intersect.point );
					this.viewCursorValid=true;
					}
			}
		}
		else
		{
			//var intersects =this.raycaster.intersectObjects( objects, false );
			//var inferIntersects = this.raycaster.intersectObjects(editor.model.entities.inferHelpers.axisObjects,false );
			//var inferIntersects = this.raycaster.intersectObjects(editor.model.entities.inferSet.objects,false );
			var inferObjects = editor.model.entities.inferSet.build();//TODO:Cache this!
			var inferIntersects = this.raycaster.intersectObjects(inferObjects,false );
			if ( inferIntersects.length > 0 ) {
				for (var i = 0, len = inferIntersects.length; i < len; i++) {
					var intersect = inferIntersects[ i ];
					var inferedPoint = intersect.point;
					//console.log("Infer Axis");
					if(intersect.object.type == 'InferEdgeHelper' ||intersect.object.type == 'InferLineHelper' )
					{
						//snap to edge line.
						this.viewCursorInferString="Infer EdgeLine";		
						//let dir =intersect.point.clone().sub(intersect.object.position).normalize();
						this.lastInferLine=[intersect.object.userData.start.clone(),intersect.object.userData.end.clone()]
						this.viewCursor.position.set( inferedPoint.x,inferedPoint.y,inferedPoint.z );
					}else{
						var dist= inferedPoint.distanceTo( intersect.object.position );	
						if(dist<pointThreshold){
							//snap to axis origin.
							this.viewCursorInferString="Infer Origin";		
							this.viewCursor.position.set( intersect.object.position.x,intersect.object.position.y,intersect.object.position.z );
							
							//break at this point?
						}else 
						{
							//snap to axis line.
							this.viewCursorInferString="Infer Axis";		
			//console.log( inferedPoint.distanceTo(raycaster.ray.at(intersect.distance)));
							//dont use computed intersect point. Instead create new from closestPointToPoint
							//let dir =intersect.point.clone().sub(intersect.object.position).normalize();
							this.lastInferLine=[intersect.object.position.clone(),intersect.point.clone()]
							//console.log("InferLine:"+JSON.stringify( this.lastInferLine))
							this.viewCursor.position.set( inferedPoint.x,inferedPoint.y,inferedPoint.z );
						}
					}
					this.viewCursorValid=true;
				}
			}		
			else{
//ground plane
			}
		}

		//Final Contraints after infers
		if(this.lockedInferLine && this.viewCursorValid)
		{
			console.log("this.lockedInferLine:"+JSON.stringify( this.lockedInferLine))
			this.viewCursorInferString+=":LOCKED"
			let outVect=new THREE.Vector3();
			this.lockedInferLine.closestPointToPoint (this.viewCursor.position, false, outVect ) 
			this.viewCursor.position.set( outVect.x,outVect.y,outVect.z );

		}

	}

}
const solidLineMaterial = new THREE.LineBasicMaterial( {
	color: 0x000000,
} );
const dashedLineMaterial = new THREE.LineDashedMaterial( {
	color: 0xffffff,
	linewidth: 5,
	scale: 1,
	dashSize: 0.05,
	gapSize: 0.05,
} );
const onLineMaterial = new THREE.LineDashedMaterial( {
	color: 0x009999,
	linewidth: 5,
	scale: 1,
	dashSize: 0.05,
	gapSize: 0.05,
} );
const axisLineMaterial = new THREE.LineDashedMaterial( {
	//color: 0xffffff,
	vertexColors: true,
	linewidth: 5,
	scale: 1,
	dashSize: 0.05,
	gapSize: 0.05,
} );
class InferAxesHelper extends THREE.LineSegments {
	constructor( size = 1 ) {
		size = size || 1;
		const vertices = [
			-size, 0, 0,	size, 0, 0,
			0,-size, 0,	0, size, 0,
			0, 0,-size,	0, 0, size
		];
		const colors = [
			1, 0, 0,	1, 0.0, 0,
			0, 1, 0,	0.0, 1, 0,
			0, 0, 1,	0, 0.0, 1
		];
		const geometry = new THREE.EdgesGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

		super( geometry, axisLineMaterial );
		
		this.computeLineDistances();
		this.scale.set( 1, 1, 1 );
		geometry.needsUpdate=true;

		this.type = 'InferAxesHelper';
	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}
class InferEdgeHelper extends THREE.LineSegments {
	constructor( edge ) {
		
		let start = edge.start.position.clone()
		let dir = edge.end.position.clone().sub(edge.start.position);
		dir.setLength(1000);
		let end = start.clone().add(dir)
		start.sub(dir);			
		const vertices = start.toArray().concat(end.toArray())
		const colors = [
			1, 0, 1,	1, 0.0, 1,
		];
		const geometry = new THREE.EdgesGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

		super( geometry, axisLineMaterial );
		
		this.computeLineDistances();
		this.scale.set( 1, 1, 1 );
		geometry.needsUpdate=true;

		this.type = 'InferEdgeHelper';
		this.userData={
			start:start,
			end:end
		}
	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}
class InferLineHelper extends THREE.LineSegments {
	constructor( start,end ) {
		
		//let start = edge.start.position.clone()
		let dir = end.clone().sub(start);
		dir.setLength(1000);
		let newEnd = start.clone().add(dir)
		let newStart=start.clone().sub(dir);			
		const vertices = newStart.toArray().concat(newEnd.toArray())
		const colors = [
			1, 0, 1,	1, 0.0, 1,
		];
		const geometry = new THREE.EdgesGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

		super( geometry, axisLineMaterial );
		
		this.computeLineDistances();
		this.scale.set( 1, 1, 1 );
		geometry.needsUpdate=true;

		this.type = 'InferLineHelper';
		this.userData={
			start:start,
			end:end
		}
	}
	setFromEdge(edge)
	{
		let end=edge.end.position
		let start=edge.start.position;
		let dir = end.clone().sub(start);
		dir.setLength(1000);
		let newEnd = start.clone().add(dir)
		let newStart=start.clone().sub(dir);			

		const vertices = newStart.toArray().concat(newEnd.toArray())

		this.geometry.attributes.position.array[0]=newStart.x;
		this.geometry.attributes.position.array[1]=newStart.y;
		this.geometry.attributes.position.array[2]=newStart.z;
		this.geometry.attributes.position.array[3]=newEnd.x;
		this.geometry.attributes.position.array[4]=newEnd.y;
		this.geometry.attributes.position.array[5]=newEnd.z;


		this.computeLineDistances();
		this.scale.set( 1, 1, 1 );
		this.geometry.attributes.position.needsUpdate=true;

		this.userData={
			start:start,
			end:end
		}
	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}
class InferSet{
	constructor( start,end ) {
		this.objects=[]
		this.edgeRefs=[];
		this.axisObjects=[];
		this.lineObjects=[];
		for(var i=0;i<40;i++)
		{
			let a= new InferAxesHelper(100)
			this.axisObjects.push(a);			
			let l=new InferLineHelper(new Vector3(),new Vector3());
			this.lineObjects.push(l);
		}
	}
	remove(obj)
	{
		const index = this.objects.indexOf(obj);
		if (index > -1) { 
			this.objects.splice(index, 1); 
		}
	}
	build()
	{
		let ai=0;
		let li=0;
		let all=[]
		this.edgeRefs.forEach(edge=>{
			if(edge){
				this.axisObjects[ai].position.copy(edge.start.position)
				all.push(this.axisObjects[ai])
				ai=(ai+1)%this.axisObjects.length;//wrap at end of axis array

				this.axisObjects[ai].position.copy(edge.end.position)
				all.push(this.axisObjects[ai])
				ai=(ai+1)%this.axisObjects.length;//wrap at end of axis array

				this.lineObjects[li].setFromEdge(edge)
				all.push(this.lineObjects[li])
				li=(li+1)%this.lineObjects.length;//wrap at end of axis array

			}
		})
		return all;
		//foreach edge
		//inactive/deleted fall out.
		//add axis for verts
		//set line for edge
	}
	intersectWith(ray)
	{
		//handle rebuild and then efficent intersection
	}
	addEdgeRef(edge)
	{
		this.edgeRefs.push(edge)
	}
	removeEdgeRef(edge)
	{
		const index = this.edgeRefs.indexOf(edge);
		if (index > -1) { 
			this.edgeRefs.splice(index, 1); 
		}
	}	
	addAxis(position){
		let a= new InferAxesHelper(100)
		a.position.copy(position);
		this.objects.push(a);
		return a;
	}
	addLine(start,end){
		let l=new InferLineHelper(start,end);
		this.objects.push(l);
		return l;
	}
	render(renderer,camera)
	{
		this.objects.forEach((ent)=>{
			renderer.render( ent, camera )
		})
		let otherObjects=this.build()
		otherObjects.forEach((ent)=>{
			renderer.render( ent, camera )
		})

	}	
}
class InferHelpers{
	constructor(  ) {
		this.clear();
		this.axisObjects=[];

		//Scene Origin
		let a= new InferAxesHelper(100)
		//a.position.copy(edge.start.position);
		this.axisObjects.push(a)
	}
	clear()
	{
		this.edges=new Set()
		this.verts=new Set()

	}
	intersect(ray,threshold)
	{
		//foreach edge
		//edge.line
		// let intersect=ray.distanceSqToSegment(edge.start.position.clone(),edge.end.position.clone(),a,b)
		// if(intersect<0.00001)
		// {
		// }
		// //foreach vertex
		// let xAxisA= vert.position.clone();
		// xAxisA.x-=1000;
		// let xAxisB= vert.position.clone();
		// xAxisB.x+=1000;
		// let intersectX=ray.distanceSqToSegment(xAxisA,xAxisB,a,b)

	}
	addEdge(edge)
	{
		this.edges.add(edge);
		let eh=new InferEdgeHelper(edge);
		this.axisObjects.push(eh)

		if(!this.verts.has(edge.start)){
			let a= new InferAxesHelper(100)
			a.position.copy(edge.start.position);
			this.axisObjects.push(a)
		}
		if(!this.verts.has(edge.end)){
			let a= new InferAxesHelper(100)
			a.position.copy(edge.end.position);
			this.axisObjects.push(a)
		}

	}
	render(renderer,camera)
	{
		this.axisObjects.forEach(ent=>{
			renderer.render( ent, camera )
		})
	}
}

class LineTool {

	constructor(  ) {
		//super( );

		//const geometry = new THREE.BufferGeometry ();
		const lineHelperVertices = [];
		lineHelperVertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, 0, 0 ),
		);
		const geometry =new THREE.BufferGeometry().setFromPoints( lineHelperVertices );
		//geometry.setAttribute('position', new THREE.Float32BufferAttribute(lineHelperVertices, 3));
		geometry.needsUpdate=true;
		//geometry.computeLineDistances();
	


		this.lineHelper = new THREE.Line( geometry,  solidLineMaterial );
		this.lineHelper.visible=false;

	}

	//line width via shaders example
	//https://codepen.io/prisoner849/pen/wvdBerm

	activate()
	{
		console.log("LineTool.activate")
		editor.view.container.dom.style.cursor="crosshair"
		this.mouseIp=new InputPoint()
		this.firstIp= new InputPoint();
	}
	deactivate()
	{
		console.log("LineTool.deactivate")
		editor.view.container.dom.style.cursor="default"
		//view.invalidate
	}
	onMouseDown(event,position,view)
	{
		//console.log("onMouseDown:"+[event,position,view]) 
	}
	onKeyDown(event)
	{
		if(event.keyCode==16 && !event.repeat)
			this.mouseIp.lockInfer();
	}
	onKeyUp(event)
	{
		if(event.keyCode==16)
			this.mouseIp.unlockInfer();
	}
	onMouseUp(event,position,view)
	{
		console.log("LineTool.onMouseUp:"+event.button)

		if(event.button==1)
		{
			return;//do nothing with middle mouse 
		}

		if(event.button==2)//right button=cancel
			{
				this.firstIp.clear();
				console.log("LineTool.onMouseUp:RightButton")
				this.lineHelper.visible=false;
				
				if(this.tempAxis){
					window.editor.model.entities.inferSet.remove(this.tempAxis)
					this.tempAxis=null;
				}

				view.render()
				return;
			}
		if(!this.firstIp.viewCursorValid){
			this.firstIp.pick(view,position.x,position.y)
			this.lineHelper.visible=true;
			//console.log(position)
			this.tempAxis=window.editor.model.entities.inferSet.addAxis(this.firstIp.viewCursor.position);
			return;
		}else
		{
			if(this.tempAxis){
				window.editor.model.entities.inferSet.remove(this.tempAxis)
				this.tempAxis=null;
			}
			this.mouseIp.pick(view,position.x,position.y)
			if(this.mouseIp.viewCursorValid)
			{
				//make edge
				console.log("MakeEdge:"+[this.firstIp.viewCursor.position,this.mouseIp.viewCursor.position])
				// const edge=new Edge(new Vertex(this.firstIp.viewCursor.position.clone()),
				// 					new Vertex(this.mouseIp.viewCursor.position.clone()))



				//let edge=
				view.editor.model.entities.addEdge(this.firstIp.viewCursor.position.clone(),
												   this.mouseIp.viewCursor.position.clone());

				//view.editor.execute( new AddObjectCommand(view.editor, edge.renderObject ) );
				this.firstIp.copy(this.mouseIp);				

				var iraycaster = new THREE.Raycaster();
				iraycaster.linePrecision = 0.00001;

				// //get ray dist to other edges.
				// iraycaster.set( this.firstIp.viewCursor.position.clone(), this.mouseIp.viewCursor.position.clone().sub(this.firstIp.viewCursor.position).normalize() );
				// //console.log( iraycaster.intersectObjects( objects ));
				// var objects = view.scene.children;
				// var segIntersects = iraycaster.intersectObjects( objects );
				// if ( segIntersects.length > 0 ) {
				// 	for (var i = 0, len = segIntersects.length; i < len; i++) {
				// 		var intersect = segIntersects[ i ];
				// 		var inferedPoint = intersect.point; //on line
				// 		console.log(inferedPoint);
				// 		var irayPoint=iraycaster.ray.at(intersect.distance,new THREE.Vector3(0, 0, - 1));
				// 		console.log(irayPoint);
				// 		var dist= inferedPoint.distanceTo(irayPoint);	
				// 		console.log(dist);
				// 	}
				// }

				//this.firstIp.clear();
			}

		}

		console.log(this.mouseIp.viewCursorInferString);
		//console.log(this.mouseIp.viewCursor.position);
		view.render();
		//console.log("onMouseUp:"+[event,position,intersects.length])
	}
	onMouseMove(event,position,view)
	{
		//console.log("onMouseMove")
		if(this.firstIp.viewCursorValid){
			this.mouseIp.pick(view,position.x,position.y)
			view.viewportInfo.setInferText(this.mouseIp.viewCursorInferString);

			this.lineHelper.geometry.attributes.position.array[0]=this.firstIp.viewCursor.position.x;
			this.lineHelper.geometry.attributes.position.array[1]=this.firstIp.viewCursor.position.y;
			this.lineHelper.geometry.attributes.position.array[2]=this.firstIp.viewCursor.position.z;
			this.lineHelper.geometry.attributes.position.array[3]=this.mouseIp.viewCursor.position.x;
			this.lineHelper.geometry.attributes.position.array[4]=this.mouseIp.viewCursor.position.y;
			this.lineHelper.geometry.attributes.position.array[5]=this.mouseIp.viewCursor.position.z;
			this.lineHelper.computeLineDistances()
			this.lineHelper.geometry.attributes.position.needsUpdate=true;
		}
		//console.log("onMouseDown:"+[event,position,view]) 
	}		
	resume()
	{}
	suspend()
	{}
	onCancel()
	{}
	onLbutton(){}
	onSetCursor(){}
	draw(){}
	updateUi(){}
	resetTool(){}
	pickedPoints(){}
	drawPreview(){}
	createEdge(){}
	render(renderer,camera)
	{
		if(this.lineHelper)
			renderer.render( this.lineHelper, camera )
		if(this.mouseIp && this.mouseIp.viewCursorValid)	
			renderer.render( this.mouseIp.viewCursor, camera )		
			
	}

	//activate
	//active_model.select_tool(new LineTool())

	dispose() {

		//this.geometry.dispose();
		//this.material.dispose();

	}

}

class MoveTool {

	constructor(  ) {
		//super( );
		const lineHelperVertices = [];
		lineHelperVertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, 0, 0 ),
		);
		const geometry =new THREE.BufferGeometry().setFromPoints( lineHelperVertices );
		//geometry.setAttribute('position', new THREE.Float32BufferAttribute(lineHelperVertices, 3));
		geometry.needsUpdate=true;
		//geometry.computeLineDistances();

		this.lineHelper = new THREE.Line( geometry,  solidLineMaterial );
		this.lineHelper.visible=false;
	}
	activate()
	{
		console.log("MoveTool.activate")
		this.mouseIp=new InputPoint()
		this.firstIp= new InputPoint();
	}
	deactivate()
	{
		console.log("MoveTool.deactivate")
	}
	resume()
	{}
	suspend()
	{}
	cancel()
	{
		this.firstIp.clear();
		this.lineHelper.visible=false;
	
		if(this.tempAxis){
			window.editor.model.entities.inferSet.remove(this.tempAxis)
			this.tempAxis=null;
		}

		//Undo temporary moves
		if(this.allVerts){
			Object.values(this.allVerts).forEach(vert=>{
				this.vertStartPos[vert.id]
				vert.position.copy(this.vertStartPos[vert.id]);
				vert.updateRenderObjects();
			})
		}
		window.editor.view.render()

	}
	onMouseDown(event,position,view)
	{
		//console.log("onMouseDown:"+[event,position,view]) 
	}
	onKeyDown(event)
	{
		if(event.keyCode==16 && !event.repeat)
			this.mouseIp.lockInfer();
	}
	onKeyUp(event)
	{
		if(event.keyCode==16)
			this.mouseIp.unlockInfer();
	}
	onMouseUp(event,position,view)
	{
		console.log("LineTool.onMouseUp:"+event.button)

		if(event.button==1)
		{
			return;//do nothing with middle mouse 
		}

		if(event.button==2)//right button=cancel
			{
				this.cancel();

				return;
			}
		if(!this.firstIp.viewCursorValid){
			this.firstIp.pick(view,position.x,position.y)
			this.lineHelper.visible=true;
			//console.log(position)
			this.tempAxis=window.editor.model.entities.inferSet.addAxis(this.firstIp.viewCursor.position);

			this.entities=Array.from(editor.view.selection.selected)
			this.allVerts={}
			this.entities.forEach(ent=>{
				if(ent.type=="Edge")
				{
					this.allVerts[ent.start.id]=ent.start;
					this.allVerts[ent.end.id]=ent.end;
				}
			})

			this.vertStartPos={};
			Object.values(this.allVerts).forEach(vert=>{
				this.vertStartPos[vert.id]=vert.position.clone();
				//vert.updateRenderObjects();
			})


			return;
		}else
		{
			if(this.tempAxis){
				window.editor.model.entities.inferSet.remove(this.tempAxis)
				this.tempAxis=null;
			}
			this.mouseIp.pick(view,position.x,position.y)
			if(this.mouseIp.viewCursorValid)
			{
				this.firstIp.clear();
				console.log("LineTool.onMouseUp:RightButton")
				this.lineHelper.visible=false;
				
				//Undo temporary moves
				if(this.allVerts){
					Object.values(this.allVerts).forEach(vert=>{
						this.vertStartPos[vert.id]
						vert.position.copy(this.vertStartPos[vert.id]);
						vert.updateRenderObjects();
					})
				}

				if(this.tempAxis){
					window.editor.model.entities.inferSet.remove(this.tempAxis)
					this.tempAxis=null;
				}				
				//Move
				let vect=this.mouseIp.viewCursor.position.clone().sub(this.firstIp.viewCursor.position)
				console.log("Move Vect:"+[vect])
				let ents=Array.from(editor.view.selection.selected)
				window.editor.execute( new MoveEntitesCommand(window.editor, ents, vect ) );		

				//view.editor.model.entities.addEdge(this.firstIp.viewCursor.position.clone(),
				//								   this.mouseIp.viewCursor.position.clone());


			}

		}

		console.log(this.mouseIp.viewCursorInferString);
		//console.log(this.mouseIp.viewCursor.position);
		view.render();
		//console.log("onMouseUp:"+[event,position,intersects.length])
	}
	onMouseMove(event,position,view)
	{
		//console.log("onMouseMove")
		if(this.firstIp.viewCursorValid){
			this.mouseIp.pick(view,position.x,position.y)
			view.viewportInfo.setInferText(this.mouseIp.viewCursorInferString);

			let vect=this.mouseIp.viewCursor.position.clone().sub(this.firstIp.viewCursor.position)
			if(this.allVerts){
				Object.values(this.allVerts).forEach(vert=>{
					this.vertStartPos[vert.id]
					vert.position.copy(this.vertStartPos[vert.id]);
					vert.position.add(vect)
					vert.updateRenderObjects();
				})
			}


			this.lineHelper.geometry.attributes.position.array[0]=this.firstIp.viewCursor.position.x;
			this.lineHelper.geometry.attributes.position.array[1]=this.firstIp.viewCursor.position.y;
			this.lineHelper.geometry.attributes.position.array[2]=this.firstIp.viewCursor.position.z;
			this.lineHelper.geometry.attributes.position.array[3]=this.mouseIp.viewCursor.position.x;
			this.lineHelper.geometry.attributes.position.array[4]=this.mouseIp.viewCursor.position.y;
			this.lineHelper.geometry.attributes.position.array[5]=this.mouseIp.viewCursor.position.z;
			this.lineHelper.computeLineDistances()
			this.lineHelper.geometry.attributes.position.needsUpdate=true;
		}
		//console.log("onMouseDown:"+[event,position,view]) 
	}
	render(renderer,camera)
	{
		if(this.lineHelper)
			renderer.render( this.lineHelper, camera )
		if(this.mouseIp && this.mouseIp.viewCursorValid)	
			renderer.render( this.mouseIp.viewCursor, camera )		
			
	}	
	onLbutton(){}
	onSetCursor(){}
	draw(){}
	updateUi(){}
	resetTool(){}
	pickedPoints(){}
	drawPreview(){}

	//activate
	//active_model.select_tool(new LineTool())

	dispose() {

		//this.geometry.dispose();
		//this.material.dispose();

	}

}


export { LineTool,MoveTool,SelectTool,Entities,Selection, Model, InputPoint, RemoveEdgeCommand };
