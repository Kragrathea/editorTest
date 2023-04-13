import * as THREE from 'three';

import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { UIPanel } from './libs/ui.js';

import { EditorControls } from './EditorControls.js';

import { ViewportCamera } from './Viewport.Camera.js';
import { ViewportShading } from './Viewport.Shading.js';
import { ViewportInfo } from './Viewport.Info.js';

import { ViewHelper } from './Viewport.ViewHelper.js';
import { VR } from './Viewport.VR.js';

import { SetPositionCommand } from './commands/SetPositionCommand.js';
import { SetRotationCommand } from './commands/SetRotationCommand.js';
import { SetScaleCommand } from './commands/SetScaleCommand.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { AddObjectCommand } from './commands/AddObjectCommand.js';

import { Line2 } from '/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '/examples/jsm/lines/LineGeometry.js';
import { Model, Selection, LineTool, MoveTool } from './LineTool.js';
import { SelectTool } from './SelectTool.js';
import CameraControls from './camera-controls.module.js';



function xInferAxesHelper( size ) {

	size = size || 1;

	var vertices = [
		-size, 0, 0,	size, 0, 0,
		0,-size, 0,	0, size, 0,
		0, 0,-size,	0, 0, size
	];

	var colors = [
		1, 0, 0,	1, 0.6, 0,
		0, 1, 0,	0.6, 1, 0,
		0, 0, 1,	0, 0.6, 1
	];

	var geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

	var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
	material.visible=false;
	
	//super( geometry, material );

	//THREE.LineSegments.call( this, geometry, material );

}


function toColorArray( colors ) {

	const array = [];

	for ( let i = 0, l = colors.length; i < l; i += 3 ) {

		array.push( new THREE.Color( colors[ i ], colors[ i + 1 ], colors[ i + 2 ] ) );

	}

	return array;

}

/**
		 * Vertically paints the faces interpolating between the
		 * specified colors at the specified angels. This is used for the Background
		 * node, but could be applied to other nodes with multiple faces as well.
		 *
		 * When used with the Background node, default is directionIsDown is true if
		 * interpolating the skyColor down from the Zenith. When interpolationg up from
		 * the Nadir i.e. interpolating the groundColor, the directionIsDown is false.
		 *
		 * The first angle is never specified, it is the Zenith (0 rad). Angles are specified
		 * in radians. The geometry is thought a sphere, but could be anything. The color interpolation
		 * is linear along the Y axis in any case.
		 *
		 * You must specify one more color than you have angles at the beginning of the colors array.
		 * This is the color of the Zenith (the top of the shape).
		 *
		 * @param {BufferGeometry} geometry
		 * @param {number} radius
		 * @param {array} angles
		 * @param {array} colors
		 * @param {boolean} topDown - Whether to work top down or bottom up.
		 */
 function paintFaces( geometry, radius, angles, colors, topDown ) {
	// compute threshold values
	const thresholds = [];
	const startAngle = ( topDown === true ) ? 0 : Math.PI;
	for ( let i = 0, l = colors.length; i < l; i ++ ) {

		let angle = ( i === 0 ) ? 0 : angles[ i - 1 ];
		angle = ( topDown === true ) ? angle : ( startAngle - angle );

		const point = new THREE.Vector3();
		point.setFromSphericalCoords( radius, angle, 0 );

		thresholds.push( point );

	}

	// generate vertex colors

	const indices = geometry.index;
	const positionAttribute = geometry.attributes.position;
	const colorAttribute = new THREE.BufferAttribute( new Float32Array( geometry.attributes.position.count * 3 ), 3 );

	const position = new THREE.Vector3();
	const color = new THREE.Color();

	for ( let i = 0; i < indices.count; i ++ ) {

		const index = indices.getX( i );
		position.fromBufferAttribute( positionAttribute, index );

		let thresholdIndexA, thresholdIndexB;
		let t = 1;

		for ( let j = 1; j < thresholds.length; j ++ ) {

			thresholdIndexA = j - 1;
			thresholdIndexB = j;

			const thresholdA = thresholds[ thresholdIndexA ];
			const thresholdB = thresholds[ thresholdIndexB ];

			if ( topDown === true ) {

				// interpolation for sky color

				if ( position.y <= thresholdA.y && position.y > thresholdB.y ) {

					t = Math.abs( thresholdA.y - position.y ) / Math.abs( thresholdA.y - thresholdB.y );

					break;

				}

			} else {

				// interpolation for ground color

				if ( position.y >= thresholdA.y && position.y < thresholdB.y ) {

					t = Math.abs( thresholdA.y - position.y ) / Math.abs( thresholdA.y - thresholdB.y );

					break;

				}

			}

		}

		const colorA = colors[ thresholdIndexA ];
		const colorB = colors[ thresholdIndexB ];

		color.copy( colorA ).lerp( colorB, t );

		colorAttribute.setXYZ( index, color.r, color.g, color.b );

	}
	geometry.setAttribute( 'color', colorAttribute );
}

function buildBackground() {
	const group = new THREE.Group();

	let groundAngle=[
		1.5, 1.6
	]
	let groundColor=[
		0.2, 0.6, 0.3, 0.4, 0.4, 0.35, 0.3, 0.5, 0.6
	]
	let skyAngle=[
		1.5
	]
	let skyColor=[
		0.5, 0.7, 1, 0.7, 1, 0.9,
	]

	const radius = 900;
	if ( skyColor ) {

		const skyGeometry = new THREE.SphereGeometry( radius, 32, 16 );
		const skyMaterial = new THREE.MeshBasicMaterial( { fog: false, side: THREE.BackSide, depthWrite: false, depthTest: false } );

		if ( skyColor.length > 3 ) {

			paintFaces( skyGeometry, radius, skyAngle, toColorArray( skyColor ), true );
			skyMaterial.vertexColors = true;

		} else {

			skyMaterial.color.setRGB( skyColor[ 0 ], skyColor[ 1 ], skyColor[ 2 ] );

		}

		const sky = new THREE.Mesh( skyGeometry, skyMaterial );
		group.add( sky );

	}

	// ground

	if ( groundColor ) {

		if ( groundColor.length > 0 ) {

			const groundGeometry = new THREE.SphereGeometry( radius, 32, 16, 0, 2 * Math.PI, 0.5 * Math.PI, 1.5 * Math.PI );
			const groundMaterial = new THREE.MeshBasicMaterial( { fog: false, side: THREE.BackSide, vertexColors: true, depthWrite: false, depthTest: false } );

			paintFaces( groundGeometry, radius, groundAngle, toColorArray( groundColor ), false );

			const ground = new THREE.Mesh( groundGeometry, groundMaterial );
			group.add( ground );

		}

	}

	// render background group first

	group.renderOrder = - Infinity;

	return group;

}


// InferAxesHelper.prototype = Object.create( THREE.LineSegments.prototype );
// InferAxesHelper.prototype.constructor = InferAxesHelper;

class InferAxesHelper extends THREE.LineSegments {

	constructor( size = 1 ) {

		size = size || 1;

		var vertices = [
			-size, 0, 0,	size, 0, 0,
			0,-size, 0,	0, size, 0,
			0, 0,-size,	0, 0, size
		];
	
		var colors = [
			1, 0.6, 0,	1, 0.6, 0,
			0.6, 1, 0,	0.6, 1, 0,
			0, 0.6, 1,	0, 0.6, 1
		];
	
		var geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
	
		console.log({ vertexColors: THREE.VertexColors } )
		var material = new THREE.LineBasicMaterial( { vertexColors: true, toneMapped: false }  );
		material.visible=false;
		
		super( geometry, material );

		this.type = 'InferAxesHelper';

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}

function Viewport( editor ) {

	this.editor=editor;
	editor.view=this;

	const view = this;
	
	const signals = editor.signals;

	this.signals=editor.signals;

	const container = new UIPanel();
	this.container=container;
	container.setId( 'viewport' );
	container.setPosition( 'absolute' );

	container.add( new ViewportCamera( editor ) );
	container.add( new ViewportShading( editor ) );
	//container.add( new ViewportInfo( editor ) );

	var viewportInfo = new ViewportInfo( editor );
	this.viewportInfo=viewportInfo;
	container.add( viewportInfo );

	//

	var lastInferAxes = []
	function addInferAxes(position)
	{
		lastInferAxes = []
		var a = new InferAxesHelper( 100 );
		a.position.copy(position);
		sceneHelpers.add( a );
		lastInferAxes.push(a);
	}

	var viewCursor = null;
	var viewCursorValid = false;
	var viewCursorInferString="empty";

	var lineToolFirstPoint=null;
	var lineToolActive=true;

	let renderer = null;
	let pmremGenerator = null;

	const camera = editor.camera;
	this.camera = camera;
	
	const scene = editor.scene;
	this.scene = scene;

	this.model=editor.model;//todo: remove this and use editor directly.

	//const entities = new Entities(this)
	//this.entities=entities;

	const selection = new Selection(this)
	this.selection=selection;
	
	const sceneHelpers = editor.sceneHelpers;
	let showSceneHelpers = true;

	// helpers



	const grid = new THREE.Group();
	sceneHelpers.add( grid );

	const grid1 = new THREE.GridHelper( 30, 30, 0x888888 );
	grid1.material.color.setHex( 0x888888 );
	grid1.material.vertexColors = false;
	grid.add( grid1 );

	const grid2 = new THREE.GridHelper( 30, 6, 0x222222 );
	grid2.material.color.setHex( 0x222222 );
	grid2.material.vertexColors = false;
	grid.add( grid2 );
	grid.receiveShadow = true;
	grid1.receiveShadow = true;
	grid2.receiveShadow = true;


	grid.visible=true;

	var sceneAxis = new THREE.AxesHelper( 100 )
	sceneAxis.visible=true;
	sceneHelpers.add( sceneAxis );
	sceneAxis = new THREE.AxesHelper( -100 )
	sceneAxis.visible=true;
	sceneHelpers.add( sceneAxis );


	const viewHelper = new ViewHelper( camera, container );
	const vr = new VR( editor );

	///////////////////////////////////////////
	var debugAxis = new THREE.AxesHelper( 1.1 )
	sceneHelpers.add( debugAxis );

	viewCursor = debugAxis


	var geometry = new THREE.BufferGeometry ();
	const lineHelperVertices = [];
	lineHelperVertices.push(
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 0, 0, 0 ),
	);
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(lineHelperVertices, 3));
	geometry.needsUpdate=true;
	//geometry.computeLineDistances();

	var lineHelperMaterial = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
	//const edgeMaterial = new THREE.LineBasicMaterial( { color: 0xff00ff, toneMapped:false, linewidth: 2 } );
	const edgeMaterial = new LineMaterial( {

		color: 0xffffff,
		//linewidth: 5, // in pixels
		vertexColors: true,
		//resolution:  // to be set by renderer, eventually
		dashed: false,
		alphaToCoverage: true,
		onBeforeCompile: shader => {
		  shader.vertexShader = `
			${shader.vertexShader}
		  `.replace(`uniform float linewidth;`, `attribute float linewidth;`);
		  //console.log(shader.vertexShader)
		}
	  
	  } );
	
	var dashedLineMaterial = new THREE.LineDashedMaterial( {
		color: 0xffffff,
		linewidth: 5,
		scale: 1,
		dashSize: 0.1,
		gapSize: 0.1,
	} );
	var lineHelper = new THREE.Line( geometry,  dashedLineMaterial );
	lineHelper.visible=false;
	sceneHelpers.add( lineHelper );

	const sky=buildBackground();
	//sceneHelpers.add( sky);
	
	///////////////////////////////////////////

	//

	const box = new THREE.Box3();

	const selectionBox = new THREE.Box3Helper( box );
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	let objectPositionOnDown = null;
	let objectRotationOnDown = null;
	let objectScaleOnDown = null;

	const transformControls = new TransformControls( camera, container.dom );
	transformControls.addEventListener( 'change', function () {

		const object = transformControls.object;

		if ( object !== undefined ) {

			box.setFromObject( object, true );

			const helper = editor.helpers[ object.id ];

			if ( helper !== undefined && helper.isSkeletonHelper !== true ) {

				helper.update();

			}

			signals.refreshSidebarObject3D.dispatch( object );

		}

		render();

	} );
	transformControls.addEventListener( 'mouseDown', function () {

		const object = transformControls.object;

		objectPositionOnDown = object.position.clone();
		objectRotationOnDown = object.rotation.clone();
		objectScaleOnDown = object.scale.clone();

		controls.enabled = false;

	} );
	transformControls.addEventListener( 'mouseUp', function () {

		const object = transformControls.object;

		if ( object !== undefined ) {

			switch ( transformControls.getMode() ) {

				case 'translate':

					if ( ! objectPositionOnDown.equals( object.position ) ) {

						editor.execute( new SetPositionCommand( editor, object, object.position, objectPositionOnDown ) );

					}

					break;

				case 'rotate':

					if ( ! objectRotationOnDown.equals( object.rotation ) ) {

						editor.execute( new SetRotationCommand( editor, object, object.rotation, objectRotationOnDown ) );

					}

					break;

				case 'scale':

					if ( ! objectScaleOnDown.equals( object.scale ) ) {

						editor.execute( new SetScaleCommand( editor, object, object.scale, objectScaleOnDown ) );

					}

					break;

			}

		}

		controls.enabled = true;

	} );

	sceneHelpers.add( transformControls );

	// object picking

	const raycaster = new THREE.Raycaster();
	raycaster.params.Line2={threshold :10};
	const mouse = new THREE.Vector2();

	//////////////////////////////////
	//var myraycaster = new THREE.Raycaster();
	//myraycaster.linePrecision = 0.2;

	//High precision ray caster
	var iraycaster = new THREE.Raycaster();
	iraycaster.linePrecision = 0.00001;
	//////////////////////////////////

	// events

	function updateAspectRatio() {

		camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
		camera.updateProjectionMatrix();

	}

	function getIntersects( point ) {

		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

		raycaster.setFromCamera( mouse, camera );


		const objects = [];

		scene.traverseVisible( function ( child ) {

			objects.push( child );

		} );

		sceneHelpers.traverseVisible( function ( child ) {

			if ( child.name === 'picker' ) objects.push( child );

		} );

		return raycaster.intersectObjects( objects, false );

	}
	this.getIntersects=getIntersects;

	const onDownPosition = new THREE.Vector2();
	const onUpPosition = new THREE.Vector2();
	const onDoubleClickPosition = new THREE.Vector2();

	function getMousePosition( dom, x, y ) {

		const rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

	}

	function handleClick() {
//console.log("here")
		if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {
//console.log("there")

			if(true){
				if(lineToolActive && viewCursorValid)
				{
					if(lineToolFirstPoint===null)
					{
						lineToolFirstPoint=viewCursor.position;
						lineHelperVertices[0].set(viewCursor.position.x,viewCursor.position.y,viewCursor.position.z);
						lineHelperVertices[1].set(viewCursor.position.x,viewCursor.position.y,viewCursor.position.z);
						lineHelper.geometry.needsUpdate  = true; 
						lineHelper.visible=true;
						
						addInferAxes(viewCursor.position);
					}
					else
					{
						//add edge
						//alert("add edge");
						//var edgeGeometry = new THREE.BufferGeometry();
						const edgeVerts= []
						edgeVerts.push(
							lineHelperVertices[0].clone(),
							lineHelperVertices[1].clone(),
						);
	
						console.log("edge:"+JSON.stringify(edgeVerts))

						//const edgeGeometry = new THREE.BufferGeometry().setFromPoints( edgeVerts );
						const edgeGeometry = new LineGeometry();
						edgeGeometry.setPositions( edgeVerts );
						clr=[]
						clr.push(Math.random(), Math.random(), Math.random());
						clr.push(Math.random(), Math.random(), Math.random());
						edgeGeometry.setColors( clr );
						edgeGeometry.setAttribute("linewidth", new THREE.InstancedBufferAttribute(new Float32Array(wdth), 1));

						//edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
						edgeGeometry.needsUpdate=true;

						//get ray dist to other edges.
						iraycaster.set( lineHelperVertices[0].clone(), lineHelperVertices[1].clone().sub(lineHelperVertices[0]).normalize() );
						//console.log( iraycaster.intersectObjects( objects ));
						var objects = scene.children;
						var segIntersects = iraycaster.intersectObjects( objects );
						if ( segIntersects.length > 0 ) {
							for (var i = 0, len = segIntersects.length; i < len; i++) {
								var intersect = segIntersects[ i ];
								var inferedPoint = intersect.point; //on line
								console.log(inferedPoint);
								var irayPoint=iraycaster.ray.at(intersect.distance,new THREE.Vector3(0, 0, - 1));
								console.log(irayPoint);
								var dist= inferedPoint.distanceTo(irayPoint);	
								console.log(dist);
							}
						}
						//if(dist<thresh)
						//handle intersection
						//divide existing edge at ipoint
						//add new edge a->ipoint
						//add new edge ipoint->b
	
	
						
						
						//var edge = new THREE.Line( edgeGeometry,  edgeMaterial );

						var edge = new Line2( edgeGeometry,  edgeMaterial );
						edge.computeLineDistances();
						edge.scale.set( 1, 1, 1 );

						edge.name="Edge";
	//					lineToolFirstPoint=null;
	//					lineHelper.visible=false;
						
						lineToolFirstPoint=viewCursor.position;
						lineHelperVertices[0].set(lineHelperVertices[1].x,lineHelperVertices[1].y,lineHelperVertices[1].z);
						lineHelperVertices[1].set(viewCursor.position.x,viewCursor.position.y,viewCursor.position.z);
						lineHelper.geometry.needsUpdate  = true; 
						addInferAxes(viewCursor.position);
						

						editor.execute( new AddObjectCommand(editor, edge ) );
					editor.select( null );
					}
				}			
	
				render();
			}else{
				const intersects = getIntersects( onUpPosition );
				signals.intersectionsDetected.dispatch( intersects );

				render();
			}

		}

	}
	function getInfered(cursor)
	{
		var sceneIntersects = getIntersects( cursor, objects );
		if ( sceneIntersects.length > 0 ) {
			//sort by distance.
		}
	}

    var groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0));
	
	function onMouseMove( event ) {
		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );

		if(editor.activeTool && editor.activeTool.onMouseMove)
		{
			editor.activeTool.onMouseMove(event,onDoubleClickPosition,view)
		}

		//viewportInfo.setInferText(viewCursorInferString);
		render()//todo. only when needed?
		return;

		var objects = scene.children;
		var intersects = getIntersects( onDoubleClickPosition, objects );
		//console.log("scene:children:"+[scene,objects])

		//var infered = getInfered(onDoubleClickPosition);
		var pointThreshold = 0.03;
		var edgeThreshold = 0.03;

		//console.log([raycaster,camera])
		//cursor pos in screen space. 
		var curPos=raycaster.ray.at(1.0,new THREE.Vector3(0, 0, - 1)).project(camera);
		
		viewCursorInferString="Nothing";
		viewCursorValid=false;
		
		//default to ground if over
		var point = raycaster.ray.intersectPlane(groundPlane,new THREE.Vector3(0, 0, - 1));
		if(point!==null){
			viewCursor.position.set( point.x,point.y,point.z );
			viewCursorInferString="On Ground";					
			viewCursorValid=true;
		}
		
		if ( intersects.length > 0 ) {
			var curDist=edgeThreshold; //start at threshhold.
			viewCursorInferString= " ";

			//for (var i = 0, len = intersects.length; i < len; i++) {
			for (var i = intersects.length-1;i >=0 ; i--) {//go back to front.
				var intersect = intersects[ i ];

				if(intersect.object.name=="Edge")
				{
					//screen dist to edge.
					var screenDist = curPos.distanceTo( intersect.point.clone().project(camera));
					
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
						//console.log("v0 dist:"+curPos.distanceTo( v0.clone().project(camera)))
						if( curPos.distanceTo( v0.clone().project(camera))<pointThreshold){
							viewCursorInferString="On Endpoint";			
							viewCursor.position.copy(v0);
							viewCursorValid=true;							
						}else if( curPos.distanceTo( v1.clone().project(camera))<pointThreshold){
							viewCursorInferString="On Endpoint";			
							viewCursor.position.copy(v1);
							viewCursorValid=true;							
						}else {
							viewCursorInferString="On Edge";
							viewCursor.position.copy( intersect.pointOnLine );
							viewCursorValid=true;							
						}						
					}
				}
				else{
					viewCursorInferString="On Object "+intersect.object.name;		
					viewCursor.position.copy( intersect.point );
					viewCursorValid=true;
					}
			}
		}
		else
		{
			var inferIntersects = getIntersects( onDoubleClickPosition, lastInferAxes );
			if ( inferIntersects.length > 0 ) {
				for (var i = 0, len = inferIntersects.length; i < len; i++) {
					var intersect = inferIntersects[ i ];
					var inferedPoint = intersect.point;
					//console.log("Infer Axis");
					var dist= inferedPoint.distanceTo( intersect.object.position );	
					if(dist<pointThreshold){
						//snap to axis origin.
						viewCursorInferString="Infer Origin";		
						viewCursor.position.set( intersect.object.position.x,intersect.object.position.y,intersect.object.position.z );
						
						//break at this point?
					}else
					{
						//snap to axis line.
						viewCursorInferString="Infer Axis";		
		//console.log( inferedPoint.distanceTo(raycaster.ray.at(intersect.distance)));
						//dont use computed intersect point. Instead create new from closestPointToPoint
						viewCursor.position.set( inferedPoint.x,inferedPoint.y,inferedPoint.z );
					}
					viewCursorValid=true;
				}
			}		
			else{
//ground plane
			}
		}
		
		if(lineToolActive && viewCursorValid)
		{
			lineHelperVertices[1].set(viewCursor.position.x,viewCursor.position.y,viewCursor.position.z);
			lineHelper.geometry.needsUpdate=true;
			//lineHelper.geometry.computeLineDistances();	//for dashes
			//lineHelperVerticesNeedUpdate  = true; 
		}
		viewportInfo.setInferText(viewCursorInferString);
		//signals.geometryChanged.dispatch();//todo add right signal to update viewport info.
		render();//todo only render if moved.
	}

	function onMouseDown( event ) {

		// event.preventDefault();

		if ( event.target !== renderer.domElement ) return;

		const array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDownPosition.fromArray( array );

		if(editor.activeTool && editor.activeTool.onMouseDown)
		{
			editor.activeTool.onMouseDown(event,onDownPosition,view)
		}
		document.addEventListener( 'mouseup', onMouseUp );

	}

	function onMouseUp( event ) {

		const array = getMousePosition( container.dom, event.clientX, event.clientY );
		onUpPosition.fromArray( array );

		let handled=false;
		if(editor.activeTool && editor.activeTool.onMouseUp)
		{
			editor.activeTool.onMouseUp(event,onUpPosition,view)
		}

		//handleClick();


		document.removeEventListener( 'mouseup', onMouseUp );

	}
	function onContextMenu(event)
	{
		console.log("Context Menu Disabled!!")
		event.preventDefault();
	}
	document.addEventListener('contextmenu', onContextMenu);

	function onTouchStart( event ) {

		const touch = event.changedTouches[ 0 ];

		const array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( 'touchend', onTouchEnd );

	}

	function onTouchEnd( event ) {

		const touch = event.changedTouches[ 0 ];

		const array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'touchend', onTouchEnd );

	}

	function onDoubleClick( event ) {

		const array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );

		const intersects = getIntersects( onDoubleClickPosition );

		if ( intersects.length > 0 ) {

			const intersect = intersects[ 0 ];

			signals.objectFocused.dispatch( intersect.object );

		}

	}


	container.dom.addEventListener( 'mousedown', onMouseDown );
	container.dom.addEventListener( 'touchstart', onTouchStart, { passive: false } );
	container.dom.addEventListener( 'dblclick', onDoubleClick );
	container.dom.addEventListener( 'mousemove', onMouseMove, false );

	function onKeyDown(event)
	{
		console.log("onKeyDown"+event.keyCode)
		if(event.keyCode==32)
		{
			//editor.setTool(new SelectTool());
		}else if(event.keyCode==76 || event.keyCode==68) //L or D
		{
			//editor.setTool(new LineTool());
		}else{
			if(editor.activeTool && editor.activeTool.onKeyDown)
				editor.activeTool.onKeyDown(event)	
		}		
	}
	window.addEventListener( 'keydown', onKeyDown, false );

	function onKeyUp(event)
	{
		console.log("onKeyUp"+event.keyCode)
		if(event.keyCode==27)
		{
			if(editor.activeTool && editor.activeTool.cancel)
				editor.activeTool.cancel(event)

		}else if(event.keyCode==32)
		{
			editor.setTool(new SelectTool());
		}else if(event.keyCode==76 || event.keyCode==68) //L or D
		{
			editor.setTool(new LineTool());
		}else if(event.keyCode==77) //L or D
		{
			editor.setTool(new MoveTool());
		}else{
			if(editor.activeTool && editor.activeTool.onKeyUp)
				editor.activeTool.onKeyUp(event)	
		}		
	}
	window.addEventListener( 'keyup', onKeyUp, false );
	// controls need to be added *after* main logic,
	// otherwise controls.enabled doesn't work.

	//const controls new EditorControls( camera, container.dom );
	const controls = new CameraControls( camera, container.dom );

	controls.mouseButtons.middle=CameraControls.ACTION.ROTATE;
	controls.mouseButtons.left=CameraControls.ACTION.NONE;
	controls.mouseButtons.right=CameraControls.ACTION.NONE;
	// switch the behavior by the modifier key press
	const keyState = {
		shiftRight  : false,
		shiftLeft   : false,
		controlRight: false,
		controlLeft : false,
	};
	const updateConfig = () => {
		if ( keyState.shiftRight || keyState.shiftLeft ) {
			controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
		} else if ( keyState.controlRight || keyState.controlLeft ) {
			controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
		} else {
			controls.mouseButtons.middle = CameraControls.ACTION.ROTATE;
		}
	}
	document.addEventListener( 'keydown', ( event ) => {
		if ( event.code === 'ShiftRight'   ) keyState.shiftRight   = true;
		if ( event.code === 'ShiftLeft'    ) keyState.shiftLeft    = true;
		if ( event.code === 'ControlRight' ) keyState.controlRight = true;
		if ( event.code === 'ControlLeft'  ) keyState.controlLeft  = true;
		updateConfig();
	} );

	document.addEventListener( 'keyup', ( event ) => {
		if ( event.code === 'ShiftRight'   ) keyState.shiftRight   = false;
		if ( event.code === 'ShiftLeft'    ) keyState.shiftLeft    = false;
		if ( event.code === 'ControlRight' ) keyState.controlRight = false;
		if ( event.code === 'ControlLeft'  ) keyState.controlLeft  = false;
		updateConfig();
	} );


	controls.addEventListener( 'change', function () {

		signals.cameraChanged.dispatch( camera );
		signals.refreshSidebarObject3D.dispatch( camera );

	} );
	viewHelper.center = controls.center;

	// signals

	signals.editorCleared.add( function () {

		controls.center.set( 0, 0, 0 );
		render();

	} );

	signals.transformModeChanged.add( function ( mode ) {

		transformControls.setMode( mode );

	} );
	signals.toolChanged.add( function ( tool ) {

		console.log("Editor.toolChanged:"+tool)
		//transformControls.setMode( mode );

	} );
	signals.snapChanged.add( function ( dist ) {

		transformControls.setTranslationSnap( dist );

	} );

	signals.spaceChanged.add( function ( space ) {

		transformControls.setSpace( space );

	} );

	signals.rendererUpdated.add( function () {

		scene.traverse( function ( child ) {

			if ( child.material !== undefined ) {

				child.material.needsUpdate = true;

			}

		} );

		render();

	} );

	signals.rendererCreated.add( function ( newRenderer ) {

		if ( renderer !== null ) {

			renderer.setAnimationLoop( null );
			renderer.dispose();
			pmremGenerator.dispose();

			container.dom.removeChild( renderer.domElement );

		}

		renderer = newRenderer;

		renderer.setAnimationLoop( animate );
		renderer.setClearColor( 0xaaaaaa );

		if ( window.matchMedia ) {

			const mediaQuery = window.matchMedia( '(prefers-color-scheme: dark)' );
			mediaQuery.addEventListener( 'change', function ( event ) {

				renderer.setClearColor( event.matches ? 0x333333 : 0xaaaaaa );
				updateGridColors( grid1, grid2, event.matches ? [ 0x222222, 0x888888 ] : [ 0x888888, 0x282828 ] );

				render();

			} );

			renderer.setClearColor( mediaQuery.matches ? 0x333333 : 0xaaaaaa );
			updateGridColors( grid1, grid2, mediaQuery.matches ? [ 0x222222, 0x888888 ] : [ 0x888888, 0x282828 ] );

		}

		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		pmremGenerator = new THREE.PMREMGenerator( renderer );
		pmremGenerator.compileEquirectangularShader();

		container.dom.appendChild( renderer.domElement );

		render();

	} );

	signals.sceneGraphChanged.add( function () {

		render();

	} );

	signals.cameraChanged.add( function () {

		render();

	} );

	signals.objectSelected.add( function ( object ) {

		selectionBox.visible = false;
		transformControls.detach();

		if ( object !== null && object !== scene && object !== camera && !object.isLine2 ) {

			box.setFromObject( object, true );

			if ( box.isEmpty() === false ) {

				selectionBox.visible = true;

			}

			transformControls.attach( object );

		}

		render();

	} );

	signals.objectFocused.add( function ( object ) {

		controls.focus( object );

	} );

	signals.geometryChanged.add( function ( object ) {

		if ( object !== undefined ) {

			box.setFromObject( object, true );

		}

		render();

	} );

	signals.objectChanged.add( function ( object ) {

		if ( editor.selected === object ) {

			box.setFromObject( object, true );

		}

		if ( object.isPerspectiveCamera ) {

			object.updateProjectionMatrix();

		}

		const helper = editor.helpers[ object.id ];

		if ( helper !== undefined && helper.isSkeletonHelper !== true ) {

			helper.update();

		}

		render();

	} );

	signals.objectRemoved.add( function ( object ) {

		controls.enabled = true; // see #14180
		if ( object === transformControls.object ) {

			transformControls.detach();

		}

	} );

	signals.materialChanged.add( function () {

		render();

	} );

	// background

	signals.sceneBackgroundChanged.add( function ( backgroundType, backgroundColor, backgroundTexture, backgroundEquirectangularTexture, backgroundBlurriness, backgroundIntensity ) {

		switch ( backgroundType ) {

			case 'None':

				scene.background = null;

				break;

			case 'Color':

				scene.background = new THREE.Color( backgroundColor );

				break;

			case 'Texture':

				if ( backgroundTexture ) {

					scene.background = backgroundTexture;

				}

				break;

			case 'Equirectangular':

				if ( backgroundEquirectangularTexture ) {

					backgroundEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
					scene.background = backgroundEquirectangularTexture;
					scene.backgroundBlurriness = backgroundBlurriness;
					scene.backgroundIntensity = backgroundIntensity;

				}

				break;

		}

		render();

	} );

	// environment

	signals.sceneEnvironmentChanged.add( function ( environmentType, environmentEquirectangularTexture ) {

		switch ( environmentType ) {

			case 'None':

				scene.environment = null;

				break;

			case 'Equirectangular':

				scene.environment = null;

				if ( environmentEquirectangularTexture ) {

					environmentEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
					scene.environment = environmentEquirectangularTexture;

				}

				break;

			case 'ModelViewer':

				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

				break;

		}

		render();

	} );

	// fog

	signals.sceneFogChanged.add( function ( fogType, fogColor, fogNear, fogFar, fogDensity ) {

		switch ( fogType ) {

			case 'None':
				scene.fog = null;
				break;
			case 'Fog':
				scene.fog = new THREE.Fog( fogColor, fogNear, fogFar );
				break;
			case 'FogExp2':
				scene.fog = new THREE.FogExp2( fogColor, fogDensity );
				break;

		}

		render();

	} );

	signals.sceneFogSettingsChanged.add( function ( fogType, fogColor, fogNear, fogFar, fogDensity ) {

		switch ( fogType ) {

			case 'Fog':
				scene.fog.color.setHex( fogColor );
				scene.fog.near = fogNear;
				scene.fog.far = fogFar;
				break;
			case 'FogExp2':
				scene.fog.color.setHex( fogColor );
				scene.fog.density = fogDensity;
				break;

		}

		render();

	} );

	signals.viewportCameraChanged.add( function () {

		const viewportCamera = editor.viewportCamera;

		if ( viewportCamera.isPerspectiveCamera ) {

			viewportCamera.aspect = editor.camera.aspect;
			viewportCamera.projectionMatrix.copy( editor.camera.projectionMatrix );

		} else if ( viewportCamera.isOrthographicCamera ) {

			// TODO

		}

		// disable EditorControls when setting a user camera

		controls.enabled = ( viewportCamera === editor.camera );

		render();

	} );

	signals.viewportShadingChanged.add( function () {

		const viewportShading = editor.viewportShading;

		switch ( viewportShading ) {

			case 'default':
				scene.overrideMaterial = null;
				break;

			case 'normals':
				scene.overrideMaterial = new THREE.MeshNormalMaterial();
				break;

			case 'wireframe':
				scene.overrideMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } );
				break;

		}

		render();

	} );

	signals.exitedVR.add( render );

	//

	signals.windowResize.add( function () {

		updateAspectRatio();

		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		render();

	} );

	signals.showGridChanged.add( function ( showGrid ) {

		grid.visible = showGrid;
		render();

	} );

	signals.showHelpersChanged.add( function ( showHelpers ) {

		showSceneHelpers = showHelpers;
		transformControls.enabled = showHelpers;

		render();

	} );

	signals.cameraResetted.add( updateAspectRatio );

	// animations

	let prevActionsInUse = 0;

	const clock = new THREE.Clock(); // only used for animations

	function animate() {

		const mixer = editor.mixer;
		const delta = clock.getDelta();

		let needsUpdate = false;


		//yomotsu camera
		needsUpdate = controls.update( delta );

		// Animations


		const actions = mixer.stats.actions;

		if ( actions.inUse > 0 || prevActionsInUse > 0 ) {

			prevActionsInUse = actions.inUse;

			mixer.update( delta );
			needsUpdate = true;

		}

		// View Helper

		if ( viewHelper.animating === true ) {

			viewHelper.update( delta );
			needsUpdate = true;

		}

		if ( vr.currentSession !== null ) {

			needsUpdate = true;

		}

		if ( needsUpdate === true ) render();

	}

	//

	let startTime = 0;
	let endTime = 0;

	function render() {

		startTime = performance.now();

		renderer.setViewport( 0, 0, container.dom.offsetWidth, container.dom.offsetHeight );

		renderer.render( sky, editor.viewportCamera );
		renderer.autoClear = false;
		renderer.render( scene, editor.viewportCamera );
		renderer.autoClear = true;

		if ( camera === editor.viewportCamera ) {

			renderer.autoClear = false;
			if ( showSceneHelpers === true ) renderer.render( sceneHelpers, camera );
			
			if(editor.activeTool && editor.activeTool.render)
			{
				editor.activeTool.render(renderer,camera);
			}
			if(editor.model.entities)
			{
				editor.model.entities.render(renderer,camera);
			}
			if ( vr.currentSession === null ) viewHelper.render( renderer );
			renderer.autoClear = true;

		}

		endTime = performance.now();
		editor.signals.sceneRendered.dispatch( endTime - startTime );

	}
	this.render=render;

	return container;

}

function updateGridColors( grid1, grid2, colors ) {

	grid1.material.color.setHex( colors[ 0 ] );
	grid2.material.color.setHex( colors[ 1 ] );

}

export { Viewport };
