import * as THREE from 'three';
import { Vector3 } from '../../src/math/Vector3.js';
import { Model, Selection, LineTool, InputPoint, RemoveEdgeCommand } from './LineTool.js';

class SelectTool {


	constructor(  ) {
		//super( );
		this.mouseIp=new InputPoint()
        this.dragStart=null
        this.dragCurrent=null;
        this.dragging=false;
        this.mouseDown=false;
        this.frustum = new THREE.Frustum();
        this.helpers=[]
        this.helpers.push( new THREE.PlaneHelper(this.frustum.planes[0], 1, 0xffff00));
        this.helpers.push( new THREE.PlaneHelper(this.frustum.planes[1], 1, 0xffff00));
        this.helpers.push( new THREE.PlaneHelper(this.frustum.planes[2], 1, 0xffff00));
        this.helpers.push( new THREE.PlaneHelper(this.frustum.planes[3], 1, 0xffff00));
        this.helpers.push( new THREE.PlaneHelper(this.frustum.planes[4], 1, 0xffff00));
        this.helpers.push( new THREE.PlaneHelper(this.frustum.planes[5], 1, 0xffff00));
	}
	activate()
	{
		console.log("SelectTool.activate")
	}
	deactivate()
	{
		console.log("SelectTool.deactivate")
	}
    onKeyDown(event)
	{
		if(event.keyCode==46)//delete
        {
            editor.view.selection.selected.forEach((ent)=>{
                if(ent.type=="Edge")
                    {
                        editor.view.selection.remove(ent)
                        window.editor.execute( new RemoveEdgeCommand(window.editor, ent ) );	
                    }
            })
        }
        if(event.keyCode==67 && event.ctrlKey){
            let txt=JSON.stringify(editor.view.selection)
            var data = [new ClipboardItem({ "text/plain": new Blob([txt], { type: "text/plain" }) })];
            navigator.clipboard.write(data).then(function() {
                console.log("Copied to clipboard successfully!");
            }, function() {
                console.error("Unable to write to clipboard. :-(");
            });
        }



		//this.mouseIp.unlockInfer();
	}
	onMouseDown(event,position,view)
	{
		console.log("onMouseDown:"+[event,position,view]) 
        //         // make selection ribbon visible
        // line.visible = true;
    
        //     // update ribbon shape verts to match the mouse coordinates
        // for (let i = 0; i < line.geometry.vertices.length; i++) {
        //     line.geometry.vertices[i].x = sender.rawCoords.x;
        //     line.geometry.vertices[i].y = sender.rawCoords.y;
        // }
        // geometry.verticesNeedUpdate = true;
    
            // remember where we started
            if(event.button==0)
            {

                let newPos=position.clone();
                newPos.x =  ((event.clientX - editor.view.container.dom.offsetLeft + 0.5) / editor.view.container.dom.offsetWidth)  * 2 - 1;
                newPos.y = -((event.clientY - editor.view.container.dom.offsetTop + 0.5)  / editor.view.container.dom.offsetHeight) * 2 + 1;

                this.dragStart = newPos.clone();
                this.dragCurrent = newPos.clone();
                this.mouseDown=true;
  
                //let rawX =  (event.clientX - editor.view.container.dom.offsetLeft)      - editor.view.container.dom.offsetWidth/2;
                //let rawY = -(event.clientY - editor.view.container.dom.offsetTop + 0.5) + editor.view.container.dom.offsetHeight/2;
                let rawX =  (event.clientX - editor.view.container.dom.offsetLeft)      - editor.view.container.dom.offsetWidth/2;
                let rawY = -(event.clientY - editor.view.container.dom.offsetTop + 0.5) + editor.view.container.dom.offsetHeight/2;

                 // update ribbon shape verts to match the mouse coordinates
                this.rect.visible = true;
                for (let i = 0; i < 8; i++) {
                    this.rect.geometry.attributes.position.setXY(i, rawX,rawY);//wtf is the 1.2 needed for?
                }
                this.rect.geometry.attributes.position.needsUpdate=true;
                //this.dragging=true;
                        // update frustum to the current mouse coordinates
                updateFrustrum(view.camera, this.dragStart, this.dragCurrent, this.frustum);
            }


        
        // try to select/deselect some objects
        //selectObjects(cubes, frustum);
	}
	onMouseUp(event,position,view)
	{
        if(event.button==1)
            return;//ignore middle mouse

        this.mouseDown=false;
        if(this.dragging)
        {
            this.dragging=false;
            if(this.rect)
                this.rect.visible=false;
            return;
        }
            
		this.mouseIp.pick(view,position.x,position.y)
		if(this.mouseIp.intersectingObjects.length>0)
		{
			let firstObject=this.mouseIp.intersectingObjects[0];
			console.log(firstObject)
			if(firstObject.object.userData.edgeId)
			{
				let edge= view.editor.model.entities.findEdge(firstObject.object.userData.edgeId)
				if(event.shiftKey)
					view.selection.toggle(edge)
				else{
					view.selection.clear();
					view.selection.toggle(edge)
				}
			}else{
				//view.signals.intersectionsDetected.dispatch( intersects );
			}
		}else{
			if(!event.shiftKey)
				view.selection.clear();
		}

		// let intersects =  view.getIntersects( position )
		// if(intersects.length>0)
		// {
		// 	if(intersects[0].object.userData.edgeId)
		// 	{
		// 		let edge= view.editor.model.entities.findEdge(intersects[0].object.userData.edgeId)
		// 		if(event.shiftKey)
		// 			view.selection.toggle(edge)
		// 		else{
		// 			view.selection.clear();
		// 			view.selection.toggle(edge)
		// 		}
		// 	}else{
		// 		view.signals.intersectionsDetected.dispatch( intersects );
		// 	}
		// }
		view.render();
		//console.log("onMouseUp:"+[event,position,intersects.length])
	}

	onMouseMove(event,position,view){
				//console.log("onMouseMove")
        if(this.mouseDown){
            this.dragging=true;
            //convert pos to format updateFrustrum wants
            let newPos=position.clone();
            newPos.x =  ((event.clientX - editor.view.container.dom.offsetLeft + 0.5) / editor.view.container.dom.offsetWidth)  * 2 - 1;
            newPos.y = -((event.clientY - editor.view.container.dom.offsetTop + 0.5)  / editor.view.container.dom.offsetHeight) * 2 + 1;

            let rawX =  (event.clientX - editor.view.container.dom.offsetLeft)      - editor.view.container.dom.offsetWidth/2;
            let rawY = -(event.clientY - editor.view.container.dom.offsetTop + 0.5) + editor.view.container.dom.offsetHeight/2;

            this.rect.geometry.attributes.position.setY(1, rawY);
            //this.rect.geometry.vertices[1].y = sender.rawCoords.y;
  
            this.rect.geometry.attributes.position.setXY(2, rawX,rawY);

            //line.geometry.vertices[2].x = sender.rawCoords.x;
            //line.geometry.vertices[2].y = sender.rawCoords.y;
  
            this.rect.geometry.attributes.position.setX(3, rawX);
            //line.geometry.vertices[3].x = sender.rawCoords.x;
            this.rect.geometry.attributes.position.needsUpdate=true;


            this.dragCurrent = newPos.clone();
            updateFrustrum(view.camera, this.dragStart, this.dragCurrent, this.frustum);
            //console.log([this.dragStart,this.dragCurrent])

            if(!event.shiftKey)
                view.selection.clear();
            Object.values(view.model.entities.edges).forEach(edge => {
                if(edge && edge.renderObject)
                {
                    if (this.frustum.intersectsBox(edge.renderObject.geometry.boundingBox))
                    {
                        view.selection.add(edge)
                    }
                }
              })
           
        }
		if(true){
			this.mouseIp.pick(view,position.x,position.y)
			view.viewportInfo.setInferText(this.mouseIp.viewCursorInferString);
            let unpos=this.mouseIp.viewCursor.position.project(view.camera);
            unpos.x = (( unpos.x ) * editor.view.container.dom.offsetWidth / 2);
            unpos.y = (( unpos.y ) * editor.view.container.dom.offsetHeight / 2);
            unpos.z = 0;
            if(this.dot)
            {
                this.dot.position.copy(unpos)
                if(this.mouseIp.viewCursorInferString=="On Ground" || this.mouseIp.viewCursorInferString=="Nothing") 
                    this.dot.visible=false;
                else
                    this.dot.visible=true;
            }
            //console.log(unpos)
		}
		//console.log("onMouseDown:"+[event,position,view]) 
	}
	onLbutton(){}

	onSetCursor(){}
	draw(){}
    setupRibbon()
    {
        // this camera is used to render selection ribbon
        const ocamera = new THREE.OrthographicCamera(editor.view.container.dom.offsetWidth / -2, editor.view.container.dom.offsetWidth / 2, editor.view.container.dom.offsetHeight / 2, editor.view.container.dom.offsetHeight / -2, 0.1, 1000);
        //editor.scene.add(ocamera);
        
        ocamera.position.x = 0;
        ocamera.position.y = 0;
        ocamera.position.z = 100; // this does not matter, just far away
        
        ocamera.lookAt(0, 0, 0);
        // IMPORTANT, camera and ribbon are in layer#1,
        // Here we render by layers, from two different cameras
        //ocamera.layers.set(1);
        
        this.ocamera=ocamera;


        // selection ribbon
        var material = new THREE.LineBasicMaterial({
            color: 0xbb0000
        });
        const verts=[]
        const size=5;
        verts.push(new THREE.Vector3(-size, -size, 0));
        verts.push(new THREE.Vector3(-size, size, 0));
        verts.push(new THREE.Vector3(size, size, 0));
        verts.push(new THREE.Vector3(size, -size, 0));
        verts.push(new THREE.Vector3(-size, -size, 0));

		const geometry =new THREE.BufferGeometry().setFromPoints( verts );
        var rect = new THREE.Line(geometry, material);
        //rect.position.copy(new Vector3(20,20,0))
        //rect.layers.set(1); // IMPORTANT, this goes to layer#1, everything else remains in layer#0 by default
        rect.visible = false;        
        this.rect=rect;

        const dot = new THREE.Line(geometry.clone(), material);     
        this.dot=dot;
        this.dot.visible=true;
    }
	render(renderer,camera)
    {
        if(!this.rect)
            this.setupRibbon();

        if(this.rect && this.rect.visible)
            renderer.render(this.rect,this.ocamera);

        if(this.dot && this.dot.visible)
            renderer.render(this.dot,this.ocamera);
            
        return;

		this.helpers.forEach((ent)=>{
			renderer.render( ent, camera )
		})

    }
    resume()
	{}
	suspend()
	{}
	onCancel()
	{}
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
  // this is the core of the solution,
  // it builds the Frustum object by given camera and mouse coordinates
  function updateFrustrum(camera, mousePos0, mousePos1, frustum) {
    let pos0 = new THREE.Vector3(Math.min(mousePos0.x, mousePos1.x), Math.min(mousePos0.y, mousePos1.y));
    let pos1 = new THREE.Vector3(Math.max(mousePos0.x, mousePos1.x), Math.max(mousePos0.y, mousePos1.y));
  
    // build near and far planes first
    {
        // camera direction IS normal vector for near frustum plane
      // say - plane is looking "away" from you
      let cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      
      // INVERTED! camera direction becomes a normal vector for far frustum plane
      // say - plane is "facing you"
      let cameraDirInv = cameraDir.clone().negate();
  
          // calc the point that is in the middle of the view, and lies on the near plane
      let cameraNear = camera.position.clone().add(cameraDir.clone().multiplyScalar(camera.near));
      
      // calc the point that is in the middle of the view, and lies on the far plane
      let cameraFar = camera.position.clone().add(cameraDir.clone().multiplyScalar(camera.far));
  
          // just build near and far planes by normal+point
      frustum.planes[0].setFromNormalAndCoplanarPoint(cameraDir, cameraNear);
      frustum.planes[1].setFromNormalAndCoplanarPoint(cameraDirInv, cameraFar);
    }
  
      // next 4 planes (left, right, top and bottom) are built by 3 points:
    // camera postion + two points on the far plane
    // each time we build a ray casting from camera through mouse coordinate, 
    // and finding intersection with far plane.
    // 
    // To build a plane we need 2 intersections with far plane.
    // This is why mouse coordinate will be duplicated and 
    // "adjusted" either in vertical or horizontal direction
  
    // build frustrum plane on the left
    if (true) {
      let ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      // Here's the example, - we take X coordinate of a mouse, and Y we set to -0.25 and 0.25 
      // values do not matter here, - important that ray will cast two different points to form 
      // the vertically aligned frustum plane.
      ray.direction.set(pos0.x, -0.25, 1).unproject(camera).sub(ray.origin).normalize();
      let far1 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far1);
  
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      // Same as before, making 2nd ray
      ray.direction.set(pos0.x, 0.25, 1).unproject(camera).sub(ray.origin).normalize();
      let far2 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far2);
  
      frustum.planes[2].setFromCoplanarPoints(camera.position, far1, far2);
    }
  
    // build frustrum plane on the right
    if (true) {
      let ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(pos1.x, 0.25, 1).unproject(camera).sub(ray.origin).normalize();
      let far1 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far1);
  
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(pos1.x, -0.25, 1).unproject(camera).sub(ray.origin).normalize();
      let far2 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far2);
  
      frustum.planes[3].setFromCoplanarPoints(camera.position, far1, far2);
    }
  
    // build frustrum plane on the top
    if (true) {
      let ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(0.25, pos0.y, 1).unproject(camera).sub(ray.origin).normalize();
      let far1 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far1);
  
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(-0.25, pos0.y, 1).unproject(camera).sub(ray.origin).normalize();
      let far2 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far2);
  
      frustum.planes[4].setFromCoplanarPoints(camera.position, far1, far2);
    }
  
    // build frustrum plane on the bottom
    if (true) {
      let ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(-0.25, pos1.y, 1).unproject(camera).sub(ray.origin).normalize();
      let far1 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far1);
  
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(0.25, pos1.y, 1).unproject(camera).sub(ray.origin).normalize();
      let far2 = new THREE.Vector3();
      ray.intersectPlane(frustum.planes[1], far2);
  
      frustum.planes[5].setFromCoplanarPoints(camera.position, far1, far2);
    }
  }
  


// class RayysMouse {
//     constructor(renderer, camera, controls) {
//       this.renderer = renderer;
//       this.camera = camera;
//       this.controls = controls;
  
//       this.mouse = new THREE.Vector2();
//       this.rawCoords = new THREE.Vector2();
  
//       this.cb = {}
//       this.cb.onMouseDown = [];
//       this.cb.onMouseUp = [];
//       this.cb.onMouseMove = [];
  
//       var onMouseDown = function(event) {
//         if (this.controls) {
//           this.controls.enablePan = false;
//           this.controls.enableRotate = false;
//         }
  
//         this.prevMouse = this.mouse.clone();
//         this.updateMouseCoords(event, this.mouse);
//         this.mouseDown = this.mouse.clone();
//         this.rawMouseDown = this.rawCoords.clone();
  
//         // notify subscribers
//         for (var i=0; i<this.cb.onMouseDown.length; i++) {
//             this.cb.onMouseDown[i](this.mouse, event, this);
//         }
//       };
  
//       var onMouseUp = function(event) {
//         this.prevMouse = this.mouse.clone();
//         this.updateMouseCoords(event);
//         this.mouseDown = undefined;
//         this.rawMouseDown = undefined;
  
//         if (this.controls) {
//           this.controls.enablePan = false;
//           this.controls.enableRotate = false;
//         }
        
//         for (var i=0; i<this.cb.onMouseUp.length; i++) {
//             this.cb.onMouseUp[i](this.mouse, event, this);
//         }
//       };
  
//       var onMouseMove = function(event) {
//         this.prevMouse = this.mouse.clone();
//         this.updateMouseCoords(event);
//         if (!this.prevMouse.equals(this.mouse)) {
//           for (var i=0; i<this.cb.onMouseMove.length; i++) {
//             this.cb.onMouseMove[i](this.mouse, event, this);
//           }
//         }
//       };
  
//       renderer.domElement.addEventListener('mousemove', onMouseMove.bind(this), false);
//       renderer.domElement.addEventListener('mousedown', onMouseDown.bind(this), false);
//       renderer.domElement.addEventListener('mouseup',   onMouseUp.bind(this),   false);
//     }
  
//     updateMouseCoords(event) {
//       this.rawCoords.x =  (event.clientX - this.renderer.domElement.offsetLeft)      - this.renderer.domElement.offsetWidth/2;
//       this.rawCoords.y = -(event.clientY - this.renderer.domElement.offsetTop + 0.5) + this.renderer.domElement.offsetHeight/2;
//       this.mouse.x =  ((event.clientX - this.renderer.domElement.offsetLeft + 0.5) / this.renderer.domElement.offsetWidth)  * 2 - 1;
//       this.mouse.y = -((event.clientY - this.renderer.domElement.offsetTop + 0.5)  / this.renderer.domElement.offsetHeight) * 2 + 1;
//     }
    
//     subscribe(mouseDownHandler, mouseMoveHandler, mouseUpHandler) {
//       this.cb.onMouseDown.push(mouseDownHandler);
//       this.cb.onMouseMove.push(mouseMoveHandler);
//       this.cb.onMouseUp.push(mouseUpHandler);
//     }
  
//   }
  
  

//   // checks if object is inside of given frustum,
//   // and updates the object material accordingly
//   function selectObjects(objects, frustum) {
//     // each object in array here is essentially a record:
//     // {
//     //   obj: scene object,
//     //   selected: flag,
//     //   bbox: object's bounding box in world coordinates
//     // }
  
//     for (let key of Object.keys(objects)) {
//         // three.js Frustum can not intersect meshes,
//       // it can only intersect boxes, spheres (mainly for performance reasons)
//       // TODO: // to make it precisely work with complex meshes, 
//       // Frustum needs to check Sphere, Box, and then iterate 
//       // throuh mesh vertices array (well, I know, this will be slow)
//       if (frustum.intersectsBox(objects[key].bbox)) {
//         if (!objects[key].selected) {
//           objects[key].obj.material = selectedMaterial;
//         }
//         objects[key].selected = true;
//       } else {
//         if (objects[key].selected) {
//           objects[key].obj.material = defaultMaterial;
//         }
//         objects[key].selected = false;
//       }
//     }
//   }
  
  // == three.js routine starts here == 
  // nothing special, just creating a scene
  
  const SHOW_FRUSTUM_PLANES = false;

//   var scene = new THREE.Scene();
//   var camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 1, 100);
//   camera.position.x = 5;
//   camera.position.y = 5;
//   camera.position.z = 5;
//   camera.lookAt(0, 0, 0);
  
//   // this camera is used to render selection ribbon
//   var ocamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 1000);
//   scene.add(ocamera);
  
//   ocamera.position.x = 0;
//   ocamera.position.y = 0;
//   ocamera.position.z = 100; // this does not matter, just far away
  
//   ocamera.lookAt(0, 0, 0);
//   // IMPORTANT, camera and ribbon are in layer#1,
//   // Here we render by layers, from two different cameras
//   ocamera.layers.set(1);
  


//   // selection ribbon
//   var material = new THREE.LineBasicMaterial({
//     color: 0x900090
//   });
//   var geometry = new THREE.Geometry();
//   geometry.vertices.push(new THREE.Vector3(-1, -1, 0));
//   geometry.vertices.push(new THREE.Vector3(-1, 1, 0));
//   geometry.vertices.push(new THREE.Vector3(1, 1, 0));
//   geometry.vertices.push(new THREE.Vector3(1, -1, 0));
//   geometry.vertices.push(new THREE.Vector3(-1, -1, 0));
//   var line = new THREE.Line(geometry, material);
//   line.layers.set(1); // IMPORTANT, this goes to layer#1, everything else remains in layer#0 by default
//   line.visible = false;
//   scene.add(line);
  
//   let frustum = new THREE.Frustum();
  
//   // this helpers will visualize frustum planes,
//   // I keep it here for debug reasons
//   if (SHOW_FRUSTUM_PLANES) {
//     let helper0 = new THREE.PlaneHelper(frustum.planes[0], 1, 0xffff00);
//     scene.add(helper0);
//     let helper1 = new THREE.PlaneHelper(frustum.planes[1], 1, 0xffff00);
//     scene.add(helper1);
//     let helper2 = new THREE.PlaneHelper(frustum.planes[2], 1, 0xffff00);
//     scene.add(helper2);
//     let helper3 = new THREE.PlaneHelper(frustum.planes[3], 1, 0xffff00);
//     scene.add(helper3);
//     let helper4 = new THREE.PlaneHelper(frustum.planes[4], 1, 0xffff00);
//     scene.add(helper4);
//     let helper5 = new THREE.PlaneHelper(frustum.planes[5], 1, 0xffff00);
//     scene.add(helper5);
//   }
  
//   let pos0, pos1; // mouse coordinates
  
  // You find the code for this class here: https://github.com/nmalex/three.js-helpers
//   var mouse = new RayysMouse(renderer, camera, controls);
  
  // subscribe my helper class, to receive mouse coordinates
  // in convenient format
//   mouse.subscribe(
//     function handleMouseDown(pos, event, sender) {
//         // make selection ribbon visible
//       line.visible = true;
  
//           // update ribbon shape verts to match the mouse coordinates
//       for (let i = 0; i < line.geometry.vertices.length; i++) {
//         line.geometry.vertices[i].x = sender.rawCoords.x;
//         line.geometry.vertices[i].y = sender.rawCoords.y;
//       }
//       geometry.verticesNeedUpdate = true;
  
//           // remember where we started
//       pos0 = pos.clone();
//       pos1 = pos.clone();
      
//       // update frustum to the current mouse coordinates
//       updateFrustrum(camera, pos0, pos1, frustum);
      
//       // try to select/deselect some objects
//       selectObjects(cubes, frustum);
//     },
//     function handleMouseMove(pos, event, sender) {
//       if (sender.mouseDown) {
//         line.geometry.vertices[1].y = sender.rawCoords.y;
  
//         line.geometry.vertices[2].x = sender.rawCoords.x;
//         line.geometry.vertices[2].y = sender.rawCoords.y;
  
//         line.geometry.vertices[3].x = sender.rawCoords.x;
  
//         geometry.verticesNeedUpdate = true;
  
//               // pos0 - where mouse down event occurred,
//         // pos1 - where the mouse was moved
//         pos1.copy(pos);
        
//         // update frustum to the current mouse coordinates
//         updateFrustrum(camera, pos0, pos1, frustum);
        
//         // try to select/deselect some objects
//         selectObjects(cubes, frustum);
//       }
//     },
//     function handleMouseUp(pos, event, sender) {
//         // hide selection ribbon
//       line.visible = false;
//     }
//   );
  
//   var animate = function() {
//     requestAnimationFrame(animate);
//     controls.update();
  
//       // render the scene from perspective camera
//       // render layer#0 as camera belongs to it
//     renderer.render(scene, camera);
//     renderer.autoClear = false;
  
//       // render selection ribbon in layer#1 as ocamera belongs to it
//     renderer.render(scene, ocamera);
//     renderer.autoClear = true;
//   };
  
//   animate();
  
  export { SelectTool };
