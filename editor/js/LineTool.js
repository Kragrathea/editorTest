import * as THREE from 'three';
import { AddObjectCommand } from './commands/AddObjectCommand.js';
import { Line2 } from '/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '/examples/jsm/lines/LineGeometry.js';


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

class Tool{
	constructor(  ) {
	}

	activate()
	{}
  
	deactivate(view)
	{}
  
	// The {//draw} method is called by SketchUp whenever the view is refreshed to
	// allow the tool to do its own drawing. If the tool has some temporary graphics
	// that it wants displayed while it is active, it should implement this method
	// and draw to the {Sketchup::View}.
	//
	// @example
	//   draw(view)
	//     // Draw a square.
	//     points = [
	//       Geom::Point3d.new(0, 0, 0),
	//       Geom::Point3d.new(9, 0, 0),
	//       Geom::Point3d.new(9, 9, 0),
	//       Geom::Point3d.new(0, 9, 0)
	//     ]
	//     // Fill
	//     view.drawing_color = Sketchup::Color.new(255, 128, 128)
	//     view.draw(GL_QUADS, points)
	//     // Outline
	//     view.line_stipple = '' // Solid line
	//     view.drawing_color = Sketchup::Color.new(64, 0, 0)
	//     view.draw(GL_LINE_LOOP, points)
	//   {}
	//
	// @note If you draw outside the model bounds you need to implement
	//   {Tool//getExtents} which return a bounding box large enough to include the
	//   points you draw. Otherwise your drawing will be clipped.
	//
	// @param [Sketchup::View] view
	//   A View object where the method was invoked.
	//
	// @see getExtents
	//
	// @see Sketchup::View//draw
	//
	// @version SketchUp 6.0
	draw(view)
	{}
  
	// The {//enableVCB?} method is used to tell SketchUp whether to allow the user
	// to enter text into the VCB (value control box, aka the "measurements" panel).
	// If you do not implement this method, then the vcb is disabled by default.
	//
	// @example
	//   // For this tool, allow vcb text entry while the tool is active.
	//   enableVCB?
	//     return true
	//   {}
	//
	// @return [Boolean] Return +true+ if you want the VCB enabled
	//
	// @version SketchUp 6.0
	enableVCB()//?
	{}
  
	// In order to accurately draw things, SketchUp needs to know the extents of
	// what it is drawing. If the tool is doing its own drawing, it may need to
	// implement this method to tell SketchUp the extents of what it will be
	// drawing. If you don't implement this method, you may find that part of what
	// the tool is drawing gets clipped to the extents of the rest of the
	// model.
	//
	// This must return a {Geom::BoundingBox}. In a typical implementation, you
	// will create a new {Geom::BoundingBox}, add points to set the extents of the
	// drawing that the tool will do and then return it.
	//
	// @example
	//   getExtents
	//     bb = Sketchup.active_model.bounds
	//     return bb
	//   {}
	//
	// @return [Geom::BoundingBox]
	//
	// @version SketchUp 6.0
	getExtents()
	{}
  
  
	// The {//getMenu} method is called by SketchUp to let the tool provide its own
	// context menu. Most tools will not want to implement this method and,
	// instead, use the normal context menu found on all entities.
	getMenu()
	{}
  
	// The {//onCancel} method is called by SketchUp to cancel the current operation
	// of the tool. The typical response will be to reset the tool to its initial
	// state.
	//
	// The reason identifies the action that triggered the call. The reason can be
	// one of the following values:
	//
	// - +0+: the user canceled the current operation by hitting the escape key.
	// - +1+: the user re-selected the same tool from the toolbar or menu.
	// - +2+: the user did an undo while the tool was active.
	//
	// @example
	//   onCancel(reason, view)
	//     puts "MyTool was canceled for reason ////{reason} in view: //{view}"
	//   {}
	//
	// @note When something is undone {//onCancel} is called before the undo is
	//   actually executed. If you need to do something with the model after an undo
	//   use {Sketchup::ModelObserver//onTransactionUndo}.
	//
	// @note When {//onKeyDown} is implemented and returns +true+, pressing Esc
	//   doesn't trigger {//onCancel}.
	//
	onCancel(reason, view)
	{}
  
	onKeyDown(key, repeat, flags, view)
	{}
  
	onKeyUp(key, repeat, flags, view)
	{}
  
	onLButtonDoubleClick(flags, x, y, view)
	{}
  
	onLButtonDown(flags, x, y, view)
	{}
  
	onLButtonUp(flags, x, y, view)
	{}
  
	onMButtonDoubleClick(flags, x, y, view)
	{}
  
	onMButtonDown(flags, x, y, view)
	{}
  
	onMButtonUp(flags, x, y, view)
	{}
  
	// The {//onMouseEnter} method is called by SketchUp when the mouse enters the
	// viewport.
	onMouseEnter(view)
	{}
	onMouseLeave(view)
	{}
  
	onMouseMove(flags, x, y, view)
	{}
  
	//
	// @return [Boolean] Return +true+ to prevent SketchUp from performing default
	//   zoom action.
	onMouseWheel(flags, delta, x, y, view)
	{}
  
	onRButtonDoubleClick(flags, x, y, view)
	{}
	onRButtonDown(flags, x, y, view)
	{}
  
	onRButtonUp(flags, x, y, view)
	{}
  
	// The {//onReturn} method is called by SketchUp when the user hit the Return key
	// to complete an operation in the tool. This method will rarely need to be
	// implemented.
	onReturn(view)
	{}
  
	// The {//onSetCursor} method is called by SketchUp when the tool wants to set
	// the cursor.
	// @return [Boolean] Return +true+ to prevent SketchUp using the default cursor.
	onSetCursor()
	{}
  
	// The {//onUserText} method is called by SketchUp when the user has typed text
	// into the VCB and hit return.
	onUserText(text, view)
	{}
  
	// The {//resume} method is called by SketchUp when the tool becomes active again
	// after being suspended.
	resume(view)
	{}
  
	// The {//suspend} method is called by SketchUp when the tool temporarily becomes
	// inactive because another tool has been activated. This typically happens
	// when a viewing tool is activated, such as when orbit is active due to the
	// middle mouse button.
	suspend(view)
	{}
  
  }
class Entity{
	constructor() {
		this.id=THREE.MathUtils.generateUUID();
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
		this.connections=new Set()//Entity ids
		this.position=position;
	}
	connect(otherEntity)
	{
		//todo should only be edge?
		this.connections.add(otherEntity);
	}
	disconnect(otherEntity)
	{
		//todo should only be edge?
		this.connections.delete(otherEntity); 
	}	
	copy(){	}
	
}
class Entities{ 
	addEdge(edge){
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
class Edge extends Entity{
	//vertices=[ new THREE.Vertex(), new THREE.Vertex()];
	constructor(vertex1,vertex2) {
		super()
		//this.vertices=[vertex1,vertex2]
		this.start=vertex1
		this.end=vertex2
		//connect the verts to this edge.
		vertex1.connect(this)
		vertex2.connect(this)

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
		let newVert = new Vertex(splitPoint)
		let newEdge= new Edge(newVert,this.end)
		this.end.disconnect(this)//remove this edge from v2 connections

		this.end=newVert//new vert should already be connected right?
		newVert.connect(this);

		return newEdge
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
	}

	raycaster = new THREE.Raycaster();
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
		this.mouse.set( ( this.inPos.x * 2 ) - 1, - ( this.inPos.y * 2 ) + 1 );
		this.raycaster.setFromCamera( this.mouse, view.camera );
		//this.raycaster.params.Line2 = { threshold: 50 };

		var intersects =this.raycaster.intersectObjects( objects, false );

		this.intersectingObjects=intersects;

		//console.log("scene:children:"+[scene,objects])

		var pointThreshold = 0.03;
		var edgeThreshold = 0.03;

		//cursor pos in screen space. 
		var curPos=this.raycaster.ray.at(1.0,new THREE.Vector3(0, 0, - 1)).project(view.camera);
		
		this.viewCursorInferString="Nothing";
		this.viewCursorValid=false;
		
		
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
						console.log("v0:"+JSON.stringify(v0))
						var v1=new THREE.Vector3(intersect.object.geometry.attributes.instanceStart.array[3],
							intersect.object.geometry.attributes.instanceStart.array[4],
							intersect.object.geometry.attributes.instanceStart.array[5]);
						console.log("v0 dist:"+curPos.distanceTo( v0.clone().project(view.camera)))
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
							this.viewCursor.position.copy( intersect.point );
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
// 			var inferIntersects = view.getIntersects( this.inPos, lastInferAxes );
// 			if ( inferIntersects.length > 0 ) {
// 				for (var i = 0, len = inferIntersects.length; i < len; i++) {
// 					var intersect = inferIntersects[ i ];
// 					var inferedPoint = intersect.point;
// 					//console.log("Infer Axis");
// 					var dist= inferedPoint.distanceTo( intersect.object.position );	
// 					if(dist<pointThreshold){
// 						//snap to axis origin.
// 						viewCursorInferString="Infer Origin";		
// 						viewCursor.position.set( intersect.object.position.x,intersect.object.position.y,intersect.object.position.z );
						
// 						//break at this point?
// 					}else
// 					{
// 						//snap to axis line.
// 						viewCursorInferString="Infer Axis";		
// 		//console.log( inferedPoint.distanceTo(raycaster.ray.at(intersect.distance)));
// 						//dont use computed intersect point. Instead create new from closestPointToPoint
// 						viewCursor.position.set( inferedPoint.x,inferedPoint.y,inferedPoint.z );
// 					}
// 					viewCursorValid=true;
// 				}
// 			}		
// 			else{
// //ground plane
// 			}
		}

	}

}
class LineTool extends Tool {

	constructor(  ) {
		super( );

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
	
		var dashedLineMaterial = new THREE.LineDashedMaterial( {
			color: 0xffffff,
			linewidth: 5,
			scale: 1,
			dashSize: 0.05,
			gapSize: 0.05,
		} );

		this.lineHelper = new THREE.Line( geometry,  dashedLineMaterial );
		this.lineHelper.visible=false;

	}

	//line width via shaders example
	//https://codepen.io/prisoner849/pen/wvdBerm

	activate()
	{
		console.log("LineTool.activate")
		this.mouseIp=new InputPoint()
		this.firstIp= new InputPoint();
	}
	deactivate()
	{
		console.log("LineTool.deactivate")
		//view.invalidate
	}
	onMouseDown(event,position,view)
	{
		//console.log("onMouseDown:"+[event,position,view]) 
	}
	onMouseUp(event,position,view)
	{
		console.log("LineTool.onMouseUp:"+position)

		if(event.button==2)//right button=cancel
			{
				this.firstIp.clear();
				console.log("LineTool.onMouseUp:RightButton")
				this.lineHelper.visible=false;
				view.render()
				return;
			}
		if(!this.firstIp.viewCursorValid){
			this.firstIp.pick(view,position.x,position.y)
			this.lineHelper.visible=true;
			return;
		}else
		{
			this.mouseIp.pick(view,position.x,position.y)
			if(this.mouseIp.viewCursorValid)
			{
				//make edge
				console.log("MakeEdge:"+[this.firstIp.viewCursor.position,this.mouseIp.viewCursor.position])
				const edgeVerts= []
				// edgeVerts.push(
				// 	this.firstIp.viewCursor.position.clone(),
				// 	this.mouseIp.viewCursor.position.clone(),
				// );
				edgeVerts.push(
					this.firstIp.viewCursor.position.x,this.firstIp.viewCursor.position.y,this.firstIp.viewCursor.position.z,
					this.mouseIp.viewCursor.position.x,this.mouseIp.viewCursor.position.y,this.mouseIp.viewCursor.position.z
				);

				console.log("edge:"+JSON.stringify(edgeVerts))

				//move to Entites.addEdge
				//const edgeGeometry = new THREE.BufferGeometry().setFromPoints( edgeVerts );
				//edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
				const edgeGeometry = new LineGeometry();
				edgeGeometry.setPositions( edgeVerts );
				let clr=[0,0,0,0,0,0]
				edgeGeometry.setColors( clr );
				edgeGeometry.setAttribute("linewidth", new THREE.InstancedBufferAttribute(new Float32Array(1), 1));

				edgeGeometry.needsUpdate=true;
				

				const edgeMaterial = new LineMaterial( {

					//color: 0xffffff,
					linewidth: 1, // in pixels
					vertexColors: true,
					//resolution:  // to be set by renderer, eventually
					//dashed: false,
					//alphaToCoverage: true,
					// onBeforeCompile: shader => {
					//   shader.vertexShader = `
					// 	${shader.vertexShader}
					//   `.replace(`uniform float linewidth;`, `attribute float linewidth;`);
					//   //console.log(shader.vertexShader)
					// }
				  
				  } );
				  
				  edgeMaterial.resolution.set(view.container.dom.offsetWidth, view.container.dom.offsetHeight);
				//const edgeMaterial = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );//todo. Dont make new mat for every edge

				//var edge = new THREE.Line( edgeGeometry,  edgeMaterial );
				//edge.name="Edge";
				//edge.renderOrder = 1;

				var edge = new Line2( edgeGeometry,  edgeMaterial );
				edge.computeLineDistances();
				edge.scale.set( 1, 1, 1 );

				edge.name="Edge";


				view.editor.execute( new AddObjectCommand(view.editor, edge ) );
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
		console.log("onMouseMove")
		if(this.firstIp.viewCursorValid){
			this.mouseIp.pick(view,position.x,position.y)
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
	}

	//activate
	//active_model.select_tool(new LineTool())

	dispose() {

		//this.geometry.dispose();
		//this.material.dispose();

	}

}

class MoveTool extends Tool {

	constructor(  ) {
		super( );
	}
	activate()
	{
		console.log("MoveTool.activate")
	}
	deactivate()
	{
		console.log("MoveTool.deactivate")
	}
	resume()
	{}
	suspend()
	{}
	onCancel()
	{}
	onMouseMove(){}
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
class SelectTool extends Tool {

	constructor(  ) {
		super( );
	}
	activate()
	{
		console.log("SelectTool.activate")
	}
	deactivate()
	{
		console.log("SelectTool.deactivate")
	}
	onMouseDown(event,position,view)
	{
		console.log("onMouseDown:"+[event,position,view]) 
	}
	onMouseUp(event,position,view)
	{
		let intersects =  view.getIntersects( position )
		view.signals.intersectionsDetected.dispatch( intersects );
		view.render();
		//console.log("onMouseUp:"+[event,position,intersects.length])
	}
	resume()
	{}
	suspend()
	{}
	onCancel()
	{}
	onMouseMove(){}
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


export { LineTool,MoveTool,SelectTool };
