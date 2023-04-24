import * as THREE from 'three';
import { AddObjectCommand } from './commands/AddObjectCommand.js';
import { Command } from './Command.js';
import { Line2 } from '../../examples/jsm/lines/Line2.js';
import { LineMaterial } from '../../examples/jsm/lines/LineMaterial.js';  
import { LineGeometry } from '../../examples/jsm/lines/LineGeometry.js';
import { Vector3 } from '../../src/math/Vector3.js';
import { SelectTool } from './SelectTool.js';
import { ShapeUtils } from '../../src/extras/ShapeUtils.js';


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
	static byId={}//should be weak set
	constructor(position,doMerge=true) {

		if(doMerge){
			let closest=Vertex.findClosest(position)
			if(closest && closest.position.manhattanDistanceTo(position)<0.000001)
			{
				console.log("WARN:Creating Duplicate Vertex:"+position)
				return(closest)
			}
		}

		super()//important
		this.connectionIds=new Set()//Entity ids
		this.position=position;
		this.type="Vertex"
		Vertex.byId[this.id]=this;

		//console.log(["byId",Entity.byId])
	}
	copy(){
		return new Vertex(this.position.clone(),false)
	}
	static findClosest(position){
		let closest=null;
		let curDist=Number.MAX_VALUE;
		Object.values(Vertex.byId).forEach(ent=>{
			if(ent){
				let dist =ent.position.manhattanDistanceTo(position);
				if(dist<curDist )
				{
					curDist=dist;
					closest=ent;
				}
			}
		})
		return(closest)
	}
	findEdge(otherVertex)
	{
		let same=Array.from(this.connectionIds).filter(x => otherVertex.connectionIds.has(x))
		if(same.length>0)
		{
			console.assert(same.length<2)//duplicate connection
			return Edge.byId[same[0]]
		}
		return null;
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
	
}
class Selection{
	constructor(view)
	{
		//VIEW may not be fully ready at this point.

		this.selected=new Set();
		this.redMaterial=redEdgeMaterial;
		this.yellowMaterial=yellowEdgeMaterial;

	}
	add(ent,material=null)
	{
		this.selected.add(ent)
		if(ent.doSelect)
			ent.doSelect(material);
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
class Model extends THREE.Group{
	constructor()
	{
		super()
		this.name="Model"
		this.entities=new Entities();
		
		this.add(this.entities)

		this.commandHistory=[]
		window.logHistory=this.logHistory
	}
	addHistory(command)
	{
		this.commandHistory.push(command)
		//console.log("History:")
		//console.log(command)
	}
	logHistory()
	{
		for(var l of editor.model.commandHistory )
			console.log(l)

	}
	saveHistory(name=null)
	{
		if(name==null)
			name="default";
		localStorage.setItem("history."+name, JSON.stringify(this.commandHistory));
	}
	replayHistory(name=null)
	{
		let commandsJson=localStorage.getItem("history."+name);
		if(commandsJson)
		{
			let commands = JSON.parse(commandsJson)
			for(var c of commands)
			{
				eval(c)
			}
			editor.view.render();
		}

	}
	// toJSON()
	// {
	// 	return {
	// 		entities:this.entities
	// 	}
	// }
	// fromJSON(json)
	// {
	// 	this.entities=new Entities();
	// }
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

		let oldEnd=this.edge.end;

		this.edge.end.disconnect(this.edge)//remove this edge from v2 connections

		this.edge.end=newVert//new vert should already be connected right?
		newVert.connect(this.edge);

		if(this.edge.start.position.distanceTo(this.edge.end.position)<0.0001)
		{
			console.log("****ZERO LENGTH EDGE in SPLIT");
		}
		

		window.editor.model.entities.edges[newEdge.id]=newEdge;

		let loops=this.edge.getLoops()
		for(var loop of loops)
		{
			if(loop && !loop.deleted)
				loop.insertEdge(this.edge,newEdge,this.edge.start,oldEnd,newVert)
		}
		
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
		
		this.editor.model.entities.removeEdge(this.newEdge.id)	//TODO. MUCH MORE to do here?

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

		this.editor.model.entities.removeEdge(this.edge.id)	//TODO. MUCH MORE to do here?

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
class AddFaceCommand extends Command {

	constructor( editor, loop ) {

		super( editor );
		this.type = 'AddFaceCommand';
		this.name = 'Add Face';
		this.updatable = false;
		//this.object = object;
		this.loop= loop;
		// if ( object !== undefined && newPosition !== undefined ) {
		// 	this.oldPosition = object.position.clone();
		// 	this.newPosition = newPosition.clone();
		// }
	}

	execute() {
		console.log("do "+this.type)
		//this.editor.model.edges
		this.face=this.editor.model.entities.addFace(this.loop)
		//window.editor.model.entities.inferSet.addEdgeRef(this.edge);
		window.editor.view.render()
		// this.object.position.copy( this.newPosition );
		// this.object.updateMatrixWorld( true );
		// this.editor.signals.objectChanged.dispatch( this.object );
	}

	undo() {
		console.log("undo "+this.type)
		this.editor.model.entities.removeEntity(this.face)
	
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

class Entities extends THREE.Group{ 
	constructor()
	{
		super()

		this.edges={};
		this.faces={};
		this.edgesList=new EdgeList(1000);
		// this.edgesList.add(new Vector3(),new Vector3(0,1,1));
		// this.edgesList.add(new Vector3(),new Vector3(2,-1,0));
		// this.edgesList.add(new Vector3(),new Vector3(2,-1,2));
		// this.edgesList.setColor(1,new THREE.Color(0,1,0))
		// this.edgesList.setColor(2,new THREE.Color(1,0,0))
		// this.edgesList.add(new Vector3(),new Vector3(2,2,2));
		//this.inferHelpers=new InferHelpers();
		this.inferSet= new InferSet();
		this.name="Entities"
	}

	test()
	{
		console.log("Testing Entities.edges")
		Object.values(this.edges).forEach(edge => {
			if(edge)
			{
				if(edge.start.position.distanceTo(edge.end.position)<0.0001)
				{
					console.log("****ZERO LENGTH EDGE"+edge);
				}
			}
		  })
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
		redEdgeMaterial.resolution.set(editor.view.container.dom.offsetWidth, editor.view.container.dom.offsetHeight);	

		yellowEdgeMaterial.resolution.set(editor.view.container.dom.offsetWidth, editor.view.container.dom.offsetHeight);	
	

	  	Object.values(this.faces).forEach(faces => {
			if(faces && faces.renderObject)
			{
				renderer.render(faces.renderObject, camera )
			}
		  })


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

	removeEdge(id)
	{
		let edge = this.findEdge(id);
		if(edge)
		{
			edge.start.disconnect(edge)
			edge.end.disconnect(edge)
			//TODO:remove edge from loops

			this.edges[edge.id]=null;//todo: more to do here!! Call edge.remove and cleanup geom.
		}
	}

	removeEntity(ent)
	{
		switch(ent.type)
		{
			case "Face":
				if(ent.delete)
					ent.delete()

				this.faces[ent.id]=null;
				break;
			case "Edge":
				this.removeEdge(ent.id)//todo. get rid of removeEdge
				break;
				
		}
	}
	addFace(loop)
	{
		const newFace = new Face(loop);
		this.faces[newFace.id]=newFace;
		return newFace
	}
	//addVert
	//mergeVert
	//undo merge
	//mergeEdge
	//undoMerge
	//mergeFace (multi mergeEdges, loops handle themselves?)
	//todo: undo/redo. Cases add/remove edge, split edge, move verts (and/or edge?)
	addEdge(startPos,endPos){

		let startStr=startPos.toArray().join(",")
		let endStr=endPos.toArray().join(",")
		editor.model.addHistory("editor.model.entities.addEdge(new THREE.Vector3("+startStr+"),new THREE.Vector3("+endStr+"))")
		
		let newEdgeDist=startPos.distanceTo(endPos)
		//find intersections
		let allIntersect=[]
		let ray=new THREE.Ray(startPos.clone(),endPos.clone().sub(startPos).normalize())
		for (var key in this.edges){
			let edge =this.edges[key];
			if(edge==null)
				continue;

			if(isPointOnLine(edge.start.position,edge.end.position,startPos)&& isPointOnLine(edge.start.position,edge.end.position,endPos))
			{
				//console.log("Colinear")
				if( isPointOnLineAndBetweenPoints(edge.start.position,edge.end.position,startPos) )
				{
					//console.log("new start between")
					let rayDist=startPos.distanceTo(startPos)
					allIntersect.push([rayDist,edge,startPos.clone(),startPos.clone()])
				}
				if( isPointOnLineAndBetweenPoints(edge.start.position,edge.end.position,endPos) )
				{
					//console.log("new end between")
					let rayDist=startPos.distanceTo(endPos)
					allIntersect.push([rayDist,edge,startPos.clone(),endPos.clone()])
				}
				if( isPointOnLineAndBetweenPoints(startPos,endPos,edge.start.position) )
				{
					//console.log("start between")
					let rayDist=startPos.distanceTo(edge.start.position)
					allIntersect.push([rayDist,edge,startPos.clone(),edge.start.position.clone()])
				}
				if( isPointOnLineAndBetweenPoints(startPos,endPos,edge.end.position) )
				{
					//console.log("start between")
					let rayDist=startPos.distanceTo(edge.end.position)
					allIntersect.push([rayDist,edge,startPos.clone(),edge.end.position.clone()])
				}				
			}else{

				let a=new THREE.Vector3();
				let b=new THREE.Vector3();
				
				let intersect=ray.distanceSqToSegment(edge.start.position.clone(),edge.end.position.clone(),a,b)
				if(intersect<0.00001)
				{
					let rayDist=startPos.distanceTo(a)// is a right? or should it be b here?
					if(rayDist-0.00001>=newEdgeDist)//past end of new seg?
						continue;

					if( !isPointOnLineAndBetweenPoints(edge.start.position,edge.end.position,a) )
					{
						console.log("Not on line")
						continue;
					}
					allIntersect.push([rayDist,edge,a.clone(),b.clone()])
					// if(rayDist<0.00001){
					// 	console.log("Cross At startPoint:"+[a,b])
					// 	//newStartVert=edges.start

					// }
					// else if(endPos.distanceTo(a)<0.00001){
					// 	console.log("Cross At endPoint:"+[a,b])
					// }
					// else if(startPos.distanceTo(a)<startPos.distanceTo(endPos)){	
					// 	console.log("Cross At:"+[a,b])
					// }
					//console.log("Intersect:"+[intersect,a,b])
				}
			}
		}
		let newVerts=[]
		let sorted=allIntersect.sort((a, b) => { return a[0]-b[0] } )

		//split all crossing lines
		let splitVerts={}
		sorted.forEach((intersect)=>{
			let edge=intersect[1]
			//let newVert=edge.split(intersect[3])
			//newVerts.push(newVert)
			edge.split(intersect[3])

			//find Vertex at pos in edge
			let splitVert=null;
			if(edge.start.position.distanceTo(intersect[3])<0.00001)
			{
				splitVert=(edge.start);
			}else if (edge.end.position.distanceTo(intersect[3])<0.00001)
			{
				splitVert=(edge.end);
			}

			if(splitVert)
			{
				splitVerts[splitVert.id]=splitVert;
			}else{
				console.log("newEdge ERROR:cant find Vertex in split edge:"+[edge,intersect[3]])
			}

			//newVerts.push(new Vertex(intersect[3]))
			//newVerts.push(edge.end)
			
		});

		//make sure start and end are in sorted vert list
		let sortedVerts=Object.values(splitVerts).sort((a, b) => { return a.position.distanceTo(startPos)-b.position.distanceTo(startPos) } )
		if(sortedVerts.length==0 || sortedVerts[0].position.distanceTo(startPos)>0.00001 )
		{
			if(sortedVerts.length){
				console.log("foobar:")
				console.log([sortedVerts[0].position.distanceTo(startPos),0.00001])
			}
			sortedVerts.unshift(new Vertex(startPos));
		}
		if(sortedVerts[sortedVerts.length-1].position.distanceTo(endPos)>0.00001 )
		{
			if(sortedVerts.length){
				console.log("foobarEnd:")
				console.log([sortedVerts[sortedVerts.length-1].position.distanceTo(endPos),0.00001])
			}
			sortedVerts.push(new Vertex(endPos));
		}	

		//newVerts.push(new Vertex(endPos));
		for(var i=0;i<sortedVerts.length-1;i++)
		{
			let existing=sortedVerts[i].findEdge(sortedVerts[i+1])
			if(existing==null)
			{
				let newEdge = new Edge(sortedVerts[i],sortedVerts[i+1])

				//if newedge crosses face then remove

				window.editor.execute( new AddEdgeCommand(window.editor, newEdge ) );	

				let loops=Loop.findAllLoops(newEdge)
				for(var loop of loops)
				{
					//editor.model.entities.addFace(loop)
					window.editor.execute( new AddFaceCommand(window.editor, loop ) );	

				}
				// let loop=Loop.findLoop(newEdge,new Vector3(0,-1,0),1)
				// if(loop.length)
				// {
				// 	let testLoop=new Loop(loop)
				// 	if(testLoop.isCw)
				// 	{
				// 		editor.model.entities.addFace(testLoop)
				// 	}
				// } 
				// let loop2=Loop.findLoop(newEdge,new Vector3(0,1,0),-1)
				// if (loop2.length)
				// {
				// 	let testLoop=new Loop(loop2)
				// 	if(testLoop.isCw){
				// 		editor.model.entities.addFace(testLoop)
				// 	}
				// }
				
				this.test();
			}else{
				console.log("Edge already exists!");
				let loops=Loop.findAllLoops(existing)
				for(var loop of loops)
				{
					//todo. test for already exists
					//editor.model.entities.addFace(loop)
					window.editor.execute( new AddFaceCommand(window.editor, loop ) );	

				}
			}
			
		}


		return// edge;

	}
}
const edgeMaterial = new LineMaterial( {

	color: 0x000000,
	//linewidth: 2, // in pixels
	vertexColors: false,
	//resolution:  // to be set by renderer, eventually
	//dashed: false,
	//alphaToCoverage: true,
	onBeforeCompile: shader => {
		shader.vertexShader = `
		${shader.vertexShader}
		`.replace(`uniform float linewidth;`, `attribute float linewidth;`);
		//console.log(shader.vertexShader)
	}

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
const redEdgeMaterial = new LineMaterial( {

	color: 0xff0000,
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
const yellowEdgeMaterial = new LineMaterial( {

	color: 0x00ffff,
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
function findColinearEdges(firstEdge,edges=[])
{
	let firstNode=firstEdge.start;

	//for(var e )
	//foreach e of connection
	//if e is colinear and not in edges 
	//edges.push(e)
	//findColinearEdges(e,edges)

	let nextEdge=edges[1]
	let nextNode=firstEdge.end
	if(nextEdge.otherVertex(nextNode)==null)
	{	
		nextNode=firstEdge.start
		firstNode=firstEdge.end
		if(nextEdge.otherVertex(nextNode)==null)
			alert("shouldn't happen")

	}

}

//findloops3d(firstEdge)
//findColinearEdges
//foreach edge
//find plane for each non colinear connected edge
// sort edges by plane and dist from first edge
// findLoop2d by plane
// at most one right and one left loop.

//push
//copy face
//new vert for each in face
//new edge for each in face
//make face
//new edge for each vert to original vert
//new face for each edge 3x new edges and one old edge

//foreach edge 
	//add new edge up add
	//add new edge between new start and old start
	//add new edge between new end and old end

//foreach vertex
//detach from all but loop
//new edge between vert and detached vert	

//foreach vertex
// make new vertex along normal
// make edge from old vert to new
//make lid by creating edges from new vert loop
//adjust height by moving verts.
//undo
//remove all new edges


//new edge between vert and detached vert	



class Loop extends Entity
{
	static byId={}
	constructor(edges)
	{
		super()

		let verts=[]
		let firstEdge=edges[0]
		let firstNode=firstEdge.start;

		let nextEdge=edges[1]
		let nextNode=firstEdge.end
		if(nextEdge.otherVertex(nextNode)==null)
		{	
			nextNode=firstEdge.start
			firstNode=firstEdge.end
			if(nextEdge.otherVertex(nextNode)==null)
				alert("shouldn't happen")

		}
		verts.push(firstNode)
		verts.push(nextNode)
		let li=2;
		while(li<edges.length)
		{	
			nextNode=nextEdge.otherVertex(nextNode)
			nextEdge=edges[li++]
			if(nextNode==null)
			{
				console.log("Error building loop")
				break;
			}
			if(nextNode==firstNode)
			{
				console.log("Done building loop")
				break;
				//done
			}
			verts.push(nextNode)
		}

		this.verts=verts;
		console.log("Finished Loop. Verts:")
		console.log(this.verts)

		let vects = this.verts.map(x=>x.position)
		let p=findPlaneFromPoints(vects)
		if(p!=null){
			this.plane=p;
		}else
		{
			alert("Bad loop normal")
		}

		//todo. Needs to suport 3d.
		let points =this.verts.map(v=>new THREE.Vector2(v.position.x,v.position.z));
		let isCw=ShapeUtils.isClockWise(points);
		this.isCw=isCw;
		//console.log(["loop isClockWise:",isCw])

		this.edges=edges;
		this.type="Loop"
		Loop.byId[this.id]=this;

	}
	make(face)
	{
		this.face=face;
		for(var edge of this.edges)
		{
			edge.addLoopRef(this)
		}
	}
	unmake(face)
	{
		this.face=face;
		for(var edge of this.edges)
		{
			edge.removeLoopRef(this)
		}
	}	
	delete()
	{
		if(this.deleted)
			return;
		
		for(var edge of this.edges)
		{
			edge.removeLoopRef(this)
		}
		Loop.byId[this.id]=null
		this.deleted=true;

	}
	findExistingLoop()
	{
		let aLoopRefs=Object.values(this.edges[0].loopRefs); 
		let bLoopRefs=Object.values(this.edges[1].loopRefs); 

		let intersection = aLoopRefs.filter(x =>x!=null&& bLoopRefs.includes(x));
		if(intersection.length>2)
			alert("classify error")

		if(intersection.length==1)
			return intersection[0]
		else
			return null;		
	}
	classify()
	{
		//foreach edge
		//if edge has no loopRefs then not part
		//if edge has loop ref && loop normal same as this norma
		//possible.push
		
		//both partner edges (first and last) must be part of same face.
		let aLoopRefs=Object.values(this.edges[0].loopRefs); 
		let bLoopRefs=Object.values(this.edges[1].loopRefs); 

		let intersection = aLoopRefs.filter(x =>x!=null&& bLoopRefs.includes(x));
		if(intersection.length>2)
			alert("classify error")

		if(intersection.length==1)
			return true
		else
			return false;
		//console.log("Loop Refs")
		//console.log([aLoopRefs,bLoopRefs])

	}
	insertEdge(oldEdge,newEdge,afterVert,beforeVert,newEnd)
	{
		let afterIndex=this.verts.indexOf(afterVert)
		let beforeIndex=this.verts.indexOf(beforeVert)
		if(afterIndex<0 || beforeIndex<0 || afterIndex==beforeIndex)
		{	
			console.log("Loop insertEdge failed to find insert location")
			return;
		}
		if(afterIndex<beforeIndex)
		{
			let edgeIndex=beforeIndex*2
			this.edges.splice(edgeIndex,0,newEdge)
			this.verts.splice(beforeIndex,0,newEnd)
			newEdge.addLoopRef(this)

		}else{
			let edgeIndex=afterIndex*2
			this.edges.splice(edgeIndex,0,newEdge)
			this.verts.splice(afterIndex,0,newEnd)
			newEdge.addLoopRef(this)
		}

	}
	merge(otherLoop,commonEdge)
	{
		//todo. Error checking
		//todo. what if one is reveresed?

		//find commonEdge in both. 
		let expectedTotal=(this.edges.length-1)+(otherLoop.edges.length-1)
		let newEdges=[]
		let i=0;
		while(this.edges[i]!=commonEdge && newEdges.length<expectedTotal){
			newEdges.push(this.edges[i])
			i++
		}
		let oi=0;
		while(otherLoop.edges[oi]!=commonEdge)
			oi++

		oi++;//bypass. should be commonEdge.
		oi=oi%otherLoop.edges.length
		while(otherLoop.edges[oi]!=commonEdge && newEdges.length<expectedTotal){
			newEdges.push(otherLoop.edges[oi])
			oi++
			oi=oi%otherLoop.edges.length
		}

		i++;//bypass. should be commonEdge.
		i=i%this.edges.length
		while(this.edges[i]!=commonEdge && newEdges.length<expectedTotal){
			newEdges.push(this.edges[i])
			i++
			i=i%this.edges.length
		}

		return newEdges;
		//this walk from start to commonEdge
		//seek to commonEdge in otherLoop
		//walk otherLoop to end
		//walk otherLoop to commonEdge
		//walk this from commonEdge to end
		//this and other loop should share
	}
	#calcPlane()
	{
		// let coplanerPoints=[]
		// for(var v of verts){
		// 	if(coplanerPoints.length==0)
		// 		push(v.position)
		// 	else if(coplanerPoints.length==1&& coplanerPoints[0].distanceTo(v.position)>0.00001)
		// 		push(v.position)
		// 	else if(coplanerPoints.length==2)
		// 	{
		// 		const normal = _vector1.subVectors( c, b ).cross( _vector2.subVectors( a, b ) ).normalize();
		// 		if()
		// 	}
		// }
		
	}
		//# Counter-clockwise angle from vector2 to vector1, as seen from normal.
	static angleBetween(vector1, vector2, normal){
		let cross=vector2.clone().cross(vector1)
		let crossDot=cross.dot(normal)
		let v1DotV2=vector1.clone().dot(vector2)
	  	return Math.atan2(crossDot, v1DotV2)
	}
	static findBest(plane,firstEdge,startNode,direction){
		let minAngle=999;
		let maxAngle=-999;
		let bestEdge=null;
		let prevNode=firstEdge.otherVertex(startNode)
		let firstVect=prevNode.position.clone().sub(startNode.position)

		for(var e of startNode.allEdges()){
			if(e==firstEdge){
				continue
			}
			let other=e.otherVertex(startNode)
			let eVect=other.position.clone().sub(startNode.position).negate()
			
			let dist =Math.abs(plane.distanceToPoint( other.position ))

			if(dist>0.1){
				console.log("Wrong plane:"+dist)
				//#puts("Wrong plane:"+planeDir.to_s)
				continue;
			}
			let angle=Loop.angleBetween(firstVect,eVect,plane.normal)
			//console.log("Angle:"+angle * 180 / Math.PI)
			if(direction<0){
				if(angle<minAngle){
					minAngle=angle
					bestEdge=e;
				}
			}else{
				if(angle>maxAngle){
					maxAngle=angle
					bestEdge=e;
				}

			}
		}

		return(bestEdge)
	}
	static findAllLoops(firstEdge)
	{
		let loop=Loop.findLoop(firstEdge,new Vector3(0,-1,0),-1)
		let loop2=Loop.findLoop(firstEdge,new Vector3(0,1,0),1)
		let allLoops=[];
		if(loop.length)
		{
			let testLoop=new Loop(loop)
			testLoop.isLeft=true;
			if(!testLoop.isCw)
			{
				allLoops.push(testLoop)
			}
		} 
		if (loop2.length)
		{
			let testLoop=new Loop(loop2)
			testLoop.isLeft=false;
			if(!testLoop.isCw){
				allLoops.push(testLoop)
			}
		}
		return allLoops;
	}
	static findLoop(firstEdge,planeDir=null,direction=-1)
	{
		//firstPlane=[Geom::Point3d.new(0,0,0),Geom::Vector3d.new(0,0,-1)]
		if(planeDir==null)
			planeDir=new Vector3(0,-1,0)

		let firstPlane=new THREE.Plane(planeDir,0)
		let loopEdges=[]
		let curNode=firstEdge.end
		if(direction>0)
			curNode=firstEdge.start;
		let best=Loop.findBest(firstPlane,firstEdge,curNode,direction)

		let loop=[]
		loop.push(best)
		while(best!=null){
			if(best==firstEdge){
				console.log("Good Loop Detected")
				return loop;
				break
			}
			if(loopEdges.indexOf(best)>-1){
				console.log("Inner Loop Detected")
				return []
				break
			}
			loopEdges.push(best);
			//#figure out endNode
			curNode=best.otherVertex(curNode)
			best=Loop.findBest(firstPlane,best,curNode,direction)

			if(best)
				loop.push(best)
		}
		if(best==null){
			console.log("Dead Ended")
			return []
		}		
		alert("never here?")
	}


}

class Face extends Entity{
	//vertices=[ new THREE.Vertex(), new THREE.Vertex()];
	static byId={};
	static oldNormalMaterial = new THREE.MeshBasicMaterial( { 
		color: 0xaaaaaa,
		side: THREE.DoubleSide 
	} );
	static oldSelectedMaterial = new THREE.MeshBasicMaterial( { 
		color: 0xaaaaff,
		side: THREE.DoubleSide 
	} );
	static normalMaterial=this.oldNormalMaterial;
	static xnormalMaterial = new THREE.ShaderMaterial({
		side: THREE.DoubleSide,
		  vertexShader: `
			varying vec2 vUv;
	  
			void main() {
			  vec3 transformed = vec3( position );
			  vec4 mvPosition = vec4( transformed, 1.0 );
			  #ifdef USE_INSTANCING
				mvPosition = instanceMatrix * mvPosition;
			  #endif
			  //vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
			  vec4 modelViewPosition = modelViewMatrix * mvPosition;
			  vUv = uv;
			  gl_Position = projectionMatrix * modelViewPosition;
			}
		  `,
		  fragmentShader: `
			uniform float u_time;
			uniform float test;
			varying vec2 vUv;
	  
			void main () {
			  //float hue = abs(sin(u_time));
			  // gl_FragColor = vec4(0.0,1.0,0.0,1.0); // green
			  gl_FragColor = vec4(0.7,0.7,0.9,1.0); // yellow
			  if (!gl_FrontFacing){
				gl_FragColor = vec4(0.8,0.8,0.8,1.0); // red
			  } 
			}
		  `,
		  uniforms: {
			u_time: { value: 0 }
		  }
		});	
	static selectedMaterial= this.oldSelectedMaterial;
	static xselectedMaterial = new THREE.ShaderMaterial({
		side: THREE.DoubleSide,
			vertexShader: `
			varying vec2 vUv;
		
			void main() {
				vec3 transformed = vec3( position );
				vec4 mvPosition = vec4( transformed, 1.0 );
				#ifdef USE_INSTANCING
				mvPosition = instanceMatrix * mvPosition;
				#endif
				//vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
				vec4 modelViewPosition = modelViewMatrix * mvPosition;
				vUv = uv;
				gl_Position = projectionMatrix * modelViewPosition;
			}
			`,
			fragmentShader: `
			uniform float u_time;
			uniform float test;
			varying vec2 vUv;
		
			void main () {
				//float hue = abs(sin(u_time));
				// gl_FragColor = vec4(0.0,1.0,0.0,1.0); // green
				gl_FragColor = vec4(0.7,0.7,1.0,1.0); // yellow
				if (!gl_FrontFacing){
				gl_FragColor = vec4(0.8,0.8,1.0,1.0); // red
				} 
			}
			`,
			uniforms: {
			u_time: { value: 0 }
			}
		});
	constructor(loop) {

		super()
		this.type="Face"

		let delLoop=loop.findExistingLoop();
		if(delLoop)
		{
			console.log("Remove existing face:")
			console.log(delLoop)
			editor.model.entities.removeEntity(delLoop.face)
		}


		loop.make(this);//registers loop with all edges
		this.loop=loop;



		Face.byId[this.id]=this;

		this.createRenderObject();

	}
	mergeWith(otherFace,commonEdge)
	{
		let newLoopEdges=this.loop.merge(otherFace.loop,commonEdge)
		
		
		editor.model.entities.removeEntity(otherFace);

		
		let newLoop=new Loop(newLoopEdges);
		this.loop.unmake();
		newLoop.make();
		newLoop.face=this;
		this.loop=newLoop
		this.updateRenderObject()

	}
	copy()
	{
		let lastVert=null
		let newLoopEdges=[]
		for(let vert of this.loop.verts){
			let nextVert =new Vertex(vert.position,false)
			if (lastVert){
				let newEdge=new Edge(lastVert,nextVert)
				newLoopEdges.push(newEdge)
			}
			lastVert=nextVert
		}
		let lastEdge=new Edge(lastVert,newLoopEdges[0].start)
		newLoopEdges.push(lastEdge) //connect first to last.

		let newLoop=new Loop(newLoopEdges);
		
		let newFace=new Face(newLoop)
		return newFace

		//let newLoop = this.loop.copy()

		//for(let vert of this.verts)
		//newVerts.push(new Vertex(vert.position.clone(),noMerge=true))
		//for newVerts
		//newEdges.push()
		//new loop(newEdges)
		//let face = new Face(loop)
		//return face	
	}
	createRenderObject()
	{
		let verts=[]

		//todo. project loop verts onto plane
		for(var vert of this.loop.verts){
			let target=new THREE.Vector3();
			this.loop.plane.projectPoint(vert.position,target)
			verts.push(new THREE.Vector2(target.x,target.z))
			//verts.push(new THREE.Vector2(vert.position.x,vert.position.z))
		}

		const shape= new THREE.Shape(verts)
		const geometry = new THREE.ShapeGeometry( shape );
		geometry.lookAt(this.loop.plane.normal)

		const face = new THREE.Mesh( geometry, Face.normalMaterial ) ;
		//face.lookAt(new THREE.Vector3(0,-1,0))

		//face.computeLineDistances();
		face.name="Face";
		face.userData.faceId=this.id
		this.renderObject=face;
	}
	updateRenderObject()
	{
		this.createRenderObject()

		if(this.renderObject && this.renderObject.geometry)
		{
			// this.renderObject.geometry.attributes.instanceStart.array[0]=this.start.position.x;
			// this.renderObject.geometry.needsUpdate=true;
			// this.renderObject.geometry.attributes.instanceStart.needsUpdate=true;
			// this.renderObject.geometry.computeBoundingBox();
			
		}
	}
	doSelect(material)
	{
		if(this.renderObject)
			if(material)
				this.renderObject.material=material;
			else
				this.renderObject.material=Face.selectedMaterial;
	}
	doUnselect()
	{
		if(this.renderObject)
			this.renderObject.material=Face.normalMaterial;
	}
	delete()
	{
		if(this.deleted)
			return;
		
		if(this.loop)
			this.loop.delete()//removes edge refs 
		
		Face.byId[this.id]=null
		this.deleted=true;
		//todo remove geometry
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


	

}
class Edge extends Entity{
	//vertices=[ new THREE.Vertex(), new THREE.Vertex()];
	static byId={};
	constructor(vertex1,vertex2) {
		if(true)
		{
			let same=Array.from(vertex1.connectionIds).filter(x => vertex2.connectionIds.has(x))
			if(same.length>0)
			{
				console.log("Edge Already Exists")
				return Edge.byId[same[0]]
			}
		}


		super()

		if(vertex1.position.distanceTo(vertex2.position)<0.0001)
		{
			console.log("****ZERO LENGTH EDGE");
		}

		this.type="Edge"
		//this.vertices=[vertex1,vertex2]
		this.start=vertex1
		this.end=vertex2
		//connect the verts to this edge.
		vertex1.connect(this)
		vertex2.connect(this)
		Edge.byId[this.id]=this;
		this.loopRefs={};
		this.lineWidth=2;
		this.createRenderObject();

	}
	addLoopRef(edge){
		this.loopRefs[edge.id]=edge;
		if(this.getLoopCount()>1)
		{
			this.lineWidth=1
			this.updateRenderObject();
		}
	}
	removeLoopRef(edge){
		delete this.loopRefs[edge.id];
		if(this.getLoopCount()<1)
		{
			this.lineWidth=2
			this.updateRenderObject();
		}
	}
	getLoopCount()
	{
		return Object.keys(this.loopRefs).length;
	}
	getLoops()
	{
		return Object.values(this.loopRefs).filter(x=>x!=null).map(l=>{
			return Loop.byId[l.id]
		})
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
		let lineWidths=[this.lineWidth]
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

			this.renderObject.geometry.attributes.linewidth.array[0]=this.lineWidth;
			this.renderObject.geometry.attributes.linewidth.needsUpdate=true;

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
	doSelect(material)
	{
		if(this.renderObject)
			if(material)
				this.renderObject.material=material;
			else
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
		let all=this.start.allEdges();
		all=all.concat(this.end.allEdges())
		//note all egdes currently includes itself
		return all;
	}
	selectConnected()
	{
		let connected=this.allConnected()
		
		connected.forEach(edge=>{editor.view.selection.add(edge)})
	}
	//# Counter-clockwise angle from vector2 to vector1, as seen from normal.
	angleBetween(vector1, vector2, normal){
		let cross=vector2.clone().cross(vector1)
		let crossDot=cross.dot(normal)
		let v1DotV2=vector1.clone().dot(vector2)
  		return Math.atan2(crossDot, v1DotV2)
	}
// 	def angleBetween(vector1, vector2, normal = Z_AXIS)
//   Math.atan2((vector2 * vector1) % normal, vector1 % vector2)
// end
	xfindBest(plane,firstEdge,startNode,direction){
		let minAngle=999;
		let maxAngle=-999;
		let bestEdge=null;
		let prevNode=firstEdge.otherVertex(startNode)
		let firstVect=prevNode.position.clone().sub(startNode.position)

		for(var e of startNode.allEdges()){
			if(e==firstEdge){
				continue
			}
			let other=e.otherVertex(startNode)
			let eVect=other.position.clone().sub(startNode.position).negate()

			
			let dist =Math.abs(plane.distanceToPoint( other.position ))
			//#puts dist
			//#normal=(firstVect*eVect).normalize
			//#puts("normal:"+normal.to_s)
			if(dist>0.1){
				console.log("Wrong plane:"+dist)
				//#puts("Wrong plane:"+planeDir.to_s)
				continue;
			}
			let angle=this.angleBetween(firstVect,eVect,plane.normal)
			//console.log("Angle:"+angle * 180 / Math.PI)
			if(direction<0){
				if(angle<minAngle){
					minAngle=angle
					bestEdge=e;
				}
			}else{
				if(angle>maxAngle){
					maxAngle=angle
					bestEdge=e;
				}

			}
		}

		// if(bestEdge!=null)
		// 	if(direction<0)
		// 		editor.view.selection.add(bestEdge,redEdgeMaterial)
		// 	else
		// 		editor.view.selection.add(bestEdge,yellowEdgeMaterial)
		//console.log(["Best",bestEdge,minAngle.radians])
		return(bestEdge)
	}
	xfindLoop(planeDir=null,direction=-1)
	{
		let firstEdge=this;

		//editor.view.selection.clear()
		//editor.view.selection.add(firstEdge,redEdgeMaterial)

		//firstPlane=[Geom::Point3d.new(0,0,0),Geom::Vector3d.new(0,0,-1)]
		if(planeDir==null)
			planeDir=new Vector3(0,-1,0)

		let firstPlane=new THREE.Plane(planeDir,0)
		let loopEdges=[]
		let curNode=firstEdge.end
		if(direction>0)
			curNode=firstEdge.start;
		let best=this.findBest(firstPlane,firstEdge,curNode,direction)

		let loop=[]
		loop.push(best)
		while(best!=null){
			if(best==firstEdge){
				console.log("Good Loop Detected")
				return loop;
				break
			}
			if(loopEdges.indexOf(best)>-1){
				console.log("Inner Loop Detected")
				return []
				break
			}
			loopEdges.push(best);
			//#figure out endNode
			curNode=best.otherVertex(curNode)
			best=this.findBest(firstPlane,best,curNode,direction)

			if(best)
				loop.push(best)
			
			//if(best!=null)
			//	editor.view.selection.add(best)
			//#//curNode=nextNode;
		}
		if(best==null){
			console.log("Dead Ended")
			return []
		}		
		alert("never here?")
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

		//newEdge.copy(this)
		//console.log("splitDist start:"+splitPoint.distanceTo(this.start.position))
		if(splitPoint.distanceTo(this.start.position)<0.000001)
		{
			//console.log("Merge Start")
			return this.start//todo. this probably shouldn't return?
		}
		if(splitPoint.distanceTo(this.end.position)<0.000001)
		{
			//console.log("Merge End")
			return this.end//todo. this probably shouldn't return?
		}

		//make sure point is on line
		if(!isPointOnLineAndBetweenPoints(this.start.position,this.end.position,splitPoint))
		{
			console.log("WARN:Attempt to split edge at point not on edge:"+[this,splitPoint])
			return null;//todo should this return?
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

//window.testEdge = new Edge(new Vertex(new THREE.Vector3(0,1,0)),new Vertex(new THREE.Vector3(0,1,0)))

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
			//console.log("LockingInferTo:"+JSON.stringify(this.lockedInferLine))
		}
	}
	unlockInfer()
	{
		this.lockedInferLine=null;
	}	
	debugAxis = new THREE.AxesHelper( 1.1 )
	viewCursor = this.debugAxis
	pick(view,x,y,doInfer=true){
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
		  Object.values(view.model.entities.faces).forEach(ent => {
			if(ent && ent.renderObject)
			{
				objects.push( ent.renderObject );
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
				else if(intersect.object.name=="Face")
				{

					this.viewCursorInferString="On Face";
					this.viewCursor.position.copy( intersect.point );
					this.viewCursorValid=true;
					this.intersectObject=intersect.object;						
					//screen dist to edge.
					//var screenDist = curPos.distanceTo( intersect.point.clone().project(view.camera));
					
					//if(screenDist<curDist)//closer previous edges.
					//{
					//	curDist=screenDist;
					//}
				}
				else{
					this.viewCursorInferString="On Object "+intersect.object.name;		
					this.viewCursor.position.copy( intersect.point );
					this.viewCursorValid=true;
					}
			}
		}
		else if(doInfer)
		{
			//var intersects =this.raycaster.intersectObjects( objects, false );
			//var inferIntersects = this.raycaster.intersectObjects(editor.model.entities.inferHelpers.axisObjects,false );
			//var inferIntersects = this.raycaster.intersectObjects(editor.model.entities.inferSet.objects,false );
			var inferObjects = editor.model.entities.inferSet.build();//TODO:Cache this!
			var inferIntersects = this.raycaster.intersectObjects(inferObjects,false );
			
			this.lastInferObject =null;	//assume no object.

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
						this.lastInferObject = intersect.object;
						this.viewCursor.position.set( inferedPoint.x,inferedPoint.y,inferedPoint.z );
					}else{
						var dist= inferedPoint.distanceTo( intersect.object.position );	
						if(dist<pointThreshold){
							//snap to axis origin.
							this.viewCursorInferString="Infer Origin";		
							this.lastInferObject = intersect.object;
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
							this.lastInferObject = intersect.object;
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
			//console.log("this.lockedInferLine:"+JSON.stringify( this.lockedInferLine))
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
	dashSize: 0.01,
	gapSize: 0.01,
} );
const axisLineMaterial = new THREE.LineDashedMaterial( {
	//color: 0xffffff,
	vertexColors: true,
	linewidth: 5,
	scale: 1,
	dashSize: 0.01,
	gapSize: 0.01,
} );
const axisSolidLineMaterial = new THREE.LineBasicMaterial( {
	//color: 0xffffff,
	vertexColors: true,
	linewidth: 5,
	scale: 1,
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
			0, 0, 1,	0, 0.0, 1,
			0, 0.4, 0,	0.0, 0.4, 0
		];
		const geometry = new THREE.EdgesGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
		geometry.needsUpdate=true;

		super( geometry, axisLineMaterial );
		
		this.computeLineDistances();
		this.scale.set( 1, 1, 1 );

		this.type = 'InferAxesHelper';
	}

	dispose() {

		//this.geometry.dispose();
		//this.material.dispose();

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

		//Scene origin axis
		//this.addAxis(new Vector3(100,1000,0));
		this.originAxis=this.addAxis(new Vector3(0,0,0));
		this.originAxis.material=axisSolidLineMaterial;
		this.originAxis.visible=true;
		this.doRender=true;
	}
	remove(obj)
	{
		const index = this.objects.indexOf(obj);
		if (index > -1) { 
			this.objects.splice(index, 1); 
			//console.log("removed:"+obj)
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

		//add legacy objs. only used for last point axis (i think)
		 this.objects.forEach(obj=>{
			 if(obj)
		 	 	all.push(obj)
			
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
		this.doRender=true;//needed for update to work.
	}
	removeEdgeRef(edge)
	{
		const index = this.edgeRefs.indexOf(edge);
		if (index > -1) { 
			this.edgeRefs.splice(index, 1); 
		}
		this.doRender=true;//needed for update to work.
	}	
	addAxis(position){
		let a= new InferAxesHelper(100)
		a.position.copy(position);
		this.objects.push(a);
		this.doRender=true;//needed for update to work.
		return a;
	}
	addLine(start,end){
		let l=new InferLineHelper(start,end);
		this.objects.push(l);
		return l;
	}
	
	render(renderer,camera)
	{
		if(this.originAxis)
		 	renderer.render( this.originAxis, camera )//always render origin
			
		if(!this.doRender)
			return;
		this.objects.forEach((ent)=>{
			renderer.render( ent, camera )
		})
		let otherObjects=this.build()
		otherObjects.forEach((ent)=>{
			renderer.render( ent, camera )
		})
		this.doRender=false;

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
class RectHelper extends THREE.Line {
	constructor( size = 1 ) {
        var material = new THREE.LineBasicMaterial({
            color: 0xbb0000
        });

        const verts=[]
        verts.push(new THREE.Vector3(-size, -size, 0));
        verts.push(new THREE.Vector3(-size, size, 0));
        verts.push(new THREE.Vector3(size, size, 0));
        verts.push(new THREE.Vector3(size, -size, 0));
        verts.push(new THREE.Vector3(-size, -size, 0));

		const geometry =new THREE.BufferGeometry().setFromPoints( verts );

		super( geometry, material );

		this.type = 'RectHelper';
	}

	dispose() {
		this.geometry.dispose();
		this.material.dispose();
	}
}
class ArrowHelper extends THREE.Line {
	constructor( size = 1 ) {
        var material = new THREE.LineBasicMaterial({
            color: 0x990000
        });

        const verts=[]

        verts.push(new THREE.Vector3(0, 0,-size));
        verts.push(new THREE.Vector3(0, 0,size));

        verts.push(new THREE.Vector3(0, 0,size));
        verts.push(new THREE.Vector3((size/2), 0,(size/2)));

        verts.push(new THREE.Vector3(0, 0,size));
        verts.push(new THREE.Vector3(-(size/2), 0,(size/2)));
        //verts.push(new THREE.Vector3(0, 0,size));
        //verts.push(new THREE.Vector3(0, size+(size/2),(size/2)));


        //verts.push(new THREE.Vector3(size, 0, 0));
        //verts.push(new THREE.Vector3(size-(size/2), -(size/2), 0));

        //verts.push(new THREE.Vector3(size, 0, 0));
        //verts.push(new THREE.Vector3(size-(size/2), +(size/2), 0));

        // verts.push(new THREE.Vector3(size, 0, 0));
        // verts.push(new THREE.Vector3(size-(size/2),0,-(size/2)));

        // verts.push(new THREE.Vector3(size, 0, 0));
        // verts.push(new THREE.Vector3(size-(size/2),  0,+(size/2)));


		const geometry =new THREE.BufferGeometry().setFromPoints( verts );

		super( geometry, material );

		this.type = 'ArrowHelper';
	}

	dispose() {
		this.geometry.dispose();
		this.material.dispose();
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
	
        const dot = new RectHelper(5)     
        this.dot=dot;
        this.dot.visible=false;

		this.lineHelper = new THREE.Line( geometry,  solidLineMaterial );
		this.lineHelper.visible=false;

	}

	//line width via shaders example
	//https://codepen.io/prisoner849/pen/wvdBerm

	activate()
	{
		//console.log("LineTool.activate")
		editor.view.container.dom.style.cursor="crosshair"
		this.mouseIp=new InputPoint()
		this.firstIp= new InputPoint();
	}
	deactivate()
	{
		//console.log("LineTool.deactivate")
		editor.view.container.dom.style.cursor="default"
		if(this.dot)
			this.dot.visible=false;
		//view.invalidate
	}
	cancel()
	{
		this.firstIp.clear();
		//console.log("LineTool.onMouseUp:RightButton")
		this.lineHelper.visible=false;
		
		if(this.tempAxis){
			window.editor.model.entities.inferSet.remove(this.tempAxis)
			this.tempAxis=null;
		}

		editor.view.render()
	}
	onMouseUp(event,position,view)
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
	onMouseDown(event,position,view)
	{
		//console.log("LineTool.onMouseDown:"+event.button)

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
			return;
		}else
		{
			this.mouseIp.pick(view,position.x,position.y)
			if(this.mouseIp.viewCursorValid)
			{
				//make edge
				//console.log("MakeEdge:"+[this.firstIp.viewCursor.position,this.mouseIp.viewCursor.position])
				// const edge=new Edge(new Vertex(this.firstIp.viewCursor.position.clone()),
				// 					new Vertex(this.mouseIp.viewCursor.position.clone()))



				//let edge=
				view.editor.model.entities.addEdge(this.firstIp.viewCursor.position.clone(),
												   this.mouseIp.viewCursor.position.clone());

				//view.editor.execute( new AddObjectCommand(view.editor, edge.renderObject ) );
				if(this.mouseIp.viewCursorInferString=="On Endpoint" || this.mouseIp.viewCursorInferString=="On Edge")
					this.cancel();
				else
					this.firstIp.copy(this.mouseIp);				

				// var iraycaster = new THREE.Raycaster();
				// iraycaster.linePrecision = 0.00001;

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
			if(this.tempAxis){
				window.editor.model.entities.inferSet.remove(this.tempAxis)
				this.tempAxis=null;
			}
		}

		//console.log(this.mouseIp.viewCursorInferString);
		//console.log(this.mouseIp.viewCursor.position);
		view.render();
		//console.log("onMouseUp:"+[event,position,intersects.length])
	}
	onMouseMove(event,position,view)
	{

		this.mouseIp.pick(view,position.x,position.y)
		view.viewportInfo.setInferText(this.mouseIp.viewCursorInferString);
		
		if(this.dot)
		{
			let unpos=this.mouseIp.viewCursor.position.clone().project(view.camera);
			unpos.x = (( unpos.x ) * editor.view.container.dom.offsetWidth / 2);
			unpos.y = (( unpos.y ) * editor.view.container.dom.offsetHeight / 2);
			unpos.z = 0;

			this.dot.position.copy(unpos)
			if(this.mouseIp.viewCursorInferString=="On Endpoint")
				this.dot.material.color.set(0x00ffff)
			else
				this.dot.material.color.set(0x990000)

			if(this.mouseIp.viewCursorInferString=="On Ground" || this.mouseIp.viewCursorInferString=="Nothing") 
				this.dot.visible=false;
			else
				this.dot.visible=true;
		}

		//console.log("onMouseMove")
		if(this.firstIp.viewCursorValid){


			this.lineHelper.geometry.attributes.position.array[0]=this.firstIp.viewCursor.position.x;
			this.lineHelper.geometry.attributes.position.array[1]=this.firstIp.viewCursor.position.y;
			this.lineHelper.geometry.attributes.position.array[2]=this.firstIp.viewCursor.position.z;
			this.lineHelper.geometry.attributes.position.array[3]=this.mouseIp.viewCursor.position.x;
			this.lineHelper.geometry.attributes.position.array[4]=this.mouseIp.viewCursor.position.y;
			this.lineHelper.geometry.attributes.position.array[5]=this.mouseIp.viewCursor.position.z;

			//color based on axis dir
			if(Math.abs(this.firstIp.viewCursor.position.x-this.mouseIp.viewCursor.position.x)<0.00001 && 
				Math.abs(this.firstIp.viewCursor.position.y-this.mouseIp.viewCursor.position.y)<0.00001)
				{
					this.lineHelper.material.color.set(0x00ff00)
					//console.log("green")
				}
				else if(Math.abs(this.firstIp.viewCursor.position.x-this.mouseIp.viewCursor.position.x)<0.00001 && 
					Math.abs(this.firstIp.viewCursor.position.z-this.mouseIp.viewCursor.position.z)<0.00001)
				{
					this.lineHelper.material.color.set(0x0000ff)
					//console.log("blue")
				}
				else if(Math.abs(this.firstIp.viewCursor.position.y-this.mouseIp.viewCursor.position.y)<0.00001 && 
					Math.abs(this.firstIp.viewCursor.position.z-this.mouseIp.viewCursor.position.z)<0.00001)
				{
					this.lineHelper.material.color.set(0xff0000)
					//console.log("red"+[Math.abs(this.firstIp.viewCursor.position.y-this.mouseIp.viewCursor.position.y),Math.abs(this.firstIp.viewCursor.position.z-this.mouseIp.viewCursor.position.z)])
				}
				else
				{
					this.lineHelper.material.color.set(0x000000)
					//console.log("black")
					//console.log("off red"+[Math.abs(this.firstIp.viewCursor.position.y-this.mouseIp.viewCursor.position.y),Math.abs(this.firstIp.viewCursor.position.z-this.mouseIp.viewCursor.position.z)])

				}


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

		//if(this.mouseIp && this.mouseIp.viewCursorValid)	
		//	renderer.render( this.mouseIp.viewCursor, camera )		

		if(this.mouseIp.lastInferObject)
			renderer.render( this.mouseIp.lastInferObject, camera )
			
		if(this.dot && this.dot.visible)
            renderer.render(this.dot,editor.view.uiCamera);	


			
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
		//console.log("MoveTool.activate")
		this.mouseIp=new InputPoint()
		this.firstIp= new InputPoint();
	}
	deactivate()
	{
		//console.log("MoveTool.deactivate")
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
		//console.log("LineTool.onMouseUp:"+event.button)

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
				//console.log("LineTool.onMouseUp:RightButton")
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
				//console.log("Move Vect:"+[vect])
				let ents=Array.from(editor.view.selection.selected)
				window.editor.execute( new MoveEntitesCommand(window.editor, ents, vect ) );		

				//view.editor.model.entities.addEdge(this.firstIp.viewCursor.position.clone(),
				//								   this.mouseIp.viewCursor.position.clone());


			}

		}

		//console.log(this.mouseIp.viewCursorInferString);
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
class PushTool {

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
		console.log("PushTool.activate")
		editor.view.selection.clear()
		this.mouseIp=new InputPoint()
		this.firstIp= new InputPoint();
	}
	deactivate()
	{
		//console.log("MoveTool.deactivate")
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

		// //Undo temporary moves
		// if(this.allVerts){
		// 	Object.values(this.allVerts).forEach(vert=>{
		// 		this.vertStartPos[vert.id]
		// 		vert.position.copy(this.vertStartPos[vert.id]);
		// 		vert.updateRenderObjects();
		// 	})
		// }
		window.editor.view.render()

	}
	onMouseDown(event,position,view)
	{
		//console.log("onMouseDown:"+[event,position,view]) 
	}
	onKeyDown(event)
	{
		//if(event.keyCode==16 && !event.repeat)
		//	this.mouseIp.lockInfer();
	}
	onKeyUp(event)
	{
		//if(event.keyCode==16)
		//	this.mouseIp.unlockInfer();
	}
	onMouseUp(event,position,view)
	{
		if(event.button==1)
			return;//do nothing with middle mouse 

		if(event.button==2)//right button=cancel
		{
			this.cancel();
			return;
		}
		if(!this.firstIp.viewCursorValid){
			//console.log(position)
			
			//this.tempAxis=window.editor.model.entities.inferSet.addAxis(this.firstIp.viewCursor.position);
			if(this.currentFace)
			{

				this.firstIp.pick(view,position.x,position.y)
				this.lineHelper.visible=true;

				let normal = this.currentFace.loop.plane.normal.setLength(100);
				let start = this.firstIp.viewCursor.position.clone();
				let end = start.clone().add(normal)
				start.sub(normal)
				this.pushLine=new THREE.Line3(start,end);

				if(true)
				{
					let newFace=this.currentFace.copy()
					//this.tempEntities=[newFace]
					this.lidFace=newFace;
					this.sideFaces=[];

					this.lidVerts=newFace.loop.verts
					this.originalVertPos=this.lidVerts.map(v=>v.position.clone())

					for(let lv of this.lidVerts)
					{
						lv.position.add(new THREE.Vector3(0,0.1,0))
					}
					//newFace.updateRenderObject();
					newFace.renderObject.geometry.translate(0,0.1,-0.0)
					for(var edge of newFace.loop.edges)
					{
						let bottomEdge=new Edge(edge.start.copy(),edge.end.copy())
						let sideEdgeA=new Edge(edge.start,bottomEdge.end)
						let sideEdgeB=new Edge(edge.end,bottomEdge.start)
						//let sideLoop=new Loop([edge,sideEdgeA,bottomEdge,sideEdgeB])
						//let sideFace=new Face(sideLoop)
						//bottomEdges.push()
						//this.sideFaces.push(sideFace)
					}
					//make face from lid edge, copy of lid edge, and two new edges from top to bottom
					//extrudeEdges.push(new Edge(lidVerts[],lidVerts[].copyNoMerge))
				//add 

				//
				}
					
				//this.tempAxis=window.editor.model.entities.inferSet.addLine(start,end);

				//this.firstIp.lockedInferLine=this.tempAxis

			}

			this.entities=Array.from(editor.view.selection.selected)
			// this.allVerts={}
			// this.entities.forEach(ent=>{
			// 	if(ent.type=="Edge")
			// 	{
			// 		this.allVerts[ent.start.id]=ent.start;
			// 		this.allVerts[ent.end.id]=ent.end;
			// 	}
			// })

			// this.vertStartPos={};
			// Object.values(this.allVerts).forEach(vert=>{
			// 	this.vertStartPos[vert.id]=vert.position.clone();
			// 	//vert.updateRenderObjects();
			// })


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
				//console.log("LineTool.onMouseUp:RightButton")
				this.lineHelper.visible=false;


				// //Undo temporary moves
				// if(this.allVerts){
				// 	Object.values(this.allVerts).forEach(vert=>{
				// 		this.vertStartPos[vert.id]
				// 		vert.position.copy(this.vertStartPos[vert.id]);
				// 		vert.updateRenderObjects();
				// 	})
				// }

				// if(this.tempAxis){
				// 	window.editor.model.entities.inferSet.remove(this.tempAxis)
				// 	this.tempAxis=null;
				// }				
				// //Move
				// let vect=this.mouseIp.viewCursor.position.clone().sub(this.firstIp.viewCursor.position)
				// //console.log("Move Vect:"+[vect])
				// let ents=Array.from(editor.view.selection.selected)
				// window.editor.execute( new MoveEntitesCommand(window.editor, ents, vect ) );		

				//view.editor.model.entities.addEdge(this.firstIp.viewCursor.position.clone(),
				//								   this.mouseIp.viewCursor.position.clone());


			}

		}

		//console.log(this.mouseIp.viewCursorInferString);
		//console.log(this.mouseIp.viewCursor.position);
		view.render();
		//console.log("onMouseUp:"+[event,position,intersects.length])
	}
	onMouseMove(event,position,view)
	{
		//console.log("onMouseMove")
		this.mouseIp.pick(view,position.x,position.y)
		view.viewportInfo.setInferText(this.mouseIp.viewCursorInferString);
		
		if(this.mouseIp.intersectObject && this.mouseIp.intersectObject.userData && this.mouseIp.intersectObject.userData.faceId)
		{
			let face = Face.byId[this.mouseIp.intersectObject.userData.faceId]
			if(face && face!=this.currentFace){
				if(this.currentFace)
					this.currentFace.doUnselect()

				face.doSelect(Face.selectedMaterial)
				this.currentFace=face;
			}
		}else{
			if(this.currentFace)
				this.currentFace.doUnselect()
		}
	
		if(this.firstIp.viewCursorValid){
			this.mouseIp.pick(view,position.x,position.y)
			view.viewportInfo.setInferText(this.mouseIp.viewCursorInferString);
			let vect=this.mouseIp.viewCursor.position.clone().sub(this.firstIp.viewCursor.position)

			if(this.pushLine){
				// //console.log("this.lockedInferLine:"+JSON.stringify( this.lockedInferLine))
				// this.viewCursorInferString+=":LOCKED"
				// let outVect=new THREE.Vector3();
				// this.pushLine.closestPointToPoint (this.mouseIp.viewCursor.position, false, outVect ) 
				let a=new THREE.Vector3();
				let b=new THREE.Vector3();
				let startPos=editor.view.camera.position.clone();
				let endPos=this.mouseIp.viewCursor.position.clone();
				let ray=new THREE.Ray(startPos,endPos.clone().sub(startPos).normalize())
				let intersect=ray.distanceSqToSegment(this.pushLine.start.clone(),this.pushLine.end.clone(),a,b)

				this.mouseIp.viewCursor.position.set( b.x,b.y,b.z );
				//ray from eye to intersection
				//find nearest intersect ray/pushLine
				//endPoint=pointOnPushLine
			}
			

			// snapTo edge/vert
			// if(face) snap only if delta = 0

			//eye to raw or snapped instersection point. 
			//nearest point on line defined by face normal at intersect point. 
			// if(this.allVerts){
			// 	Object.values(this.allVerts).forEach(vert=>{
			// 		this.vertStartPos[vert.id]
			// 		vert.position.copy(this.vertStartPos[vert.id]);
			// 		vert.position.add(vect)
			// 		vert.updateRenderObjects();
			// 	})
			// }

		}
		//console.log("onMouseDown:"+[event,position,view]) 

		this.lineHelper.geometry.attributes.position.array[0]=this.firstIp.viewCursor.position.x;
		this.lineHelper.geometry.attributes.position.array[1]=this.firstIp.viewCursor.position.y;
		this.lineHelper.geometry.attributes.position.array[2]=this.firstIp.viewCursor.position.z;
		this.lineHelper.geometry.attributes.position.array[3]=this.mouseIp.viewCursor.position.x;
		this.lineHelper.geometry.attributes.position.array[4]=this.mouseIp.viewCursor.position.y;
		this.lineHelper.geometry.attributes.position.array[5]=this.mouseIp.viewCursor.position.z;
		this.lineHelper.computeLineDistances()
		this.lineHelper.geometry.attributes.position.needsUpdate=true;
	}
	render(renderer,camera)
	{
		if(this.lineHelper)
			renderer.render( this.lineHelper, camera )

		if(this.lidFace)
			renderer.render( this.lidFace.renderObject, camera )
		//if(this.mouseIp && this.mouseIp.viewCursorValid)	
		//	renderer.render( this.mouseIp.viewCursor, camera )		
			
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
function isPointOnLine (pointA, pointB, pointToCheck) {
    var c = new THREE.Vector3();   
    c.crossVectors(pointA.clone().sub(pointToCheck), pointB.clone().sub(pointToCheck));
    return c.length()<0.00001; }

function isPointOnLineAndBetweenPoints (pointA, pointB, pointToCheck) {
    if (!isPointOnLine(pointA, pointB, pointToCheck)) {
        return false;
    }

    let d = pointA.distanceTo(pointB);

    return pointA.distanceTo(pointToCheck) < d && pointB.distanceTo(pointToCheck) < d;
}
function findPlaneFromPoints(points)
{
	let p= new THREE.Plane()
	let i=2;
	while(isPointOnLine(points[0],points[1],points[i])&& i<points.length)
	{
		i++;
	}
	if(i<points.length)
	{
		p.setFromCoplanarPoints(points[0],points[1],points[i])
		return p;
	}else
	{
		console.log("Cant find plane from points:")
		return null;
	}
}
export { LineTool,MoveTool,SelectTool,Entities,Selection, Model, InputPoint, RemoveEdgeCommand,RectHelper,ArrowHelper, Loop, Face,PushTool };
