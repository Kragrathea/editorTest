import { UIPanel, UIButton, UICheckbox } from './libs/ui.js';
import { LineTool,MoveTool } from './LineTool.js';
import { SelectTool } from './SelectTool.js';

function Toolbar( editor ) {

	const signals = editor.signals;
	const strings = editor.strings;

	const container = new UIPanel();
	container.setId( 'toolbar' );

	const selectToolIcon = document.createElement( 'img' );
	selectToolIcon.title = strings.getKey( 'toolbar/translate' );
	selectToolIcon.src = 'images/cursor.svg';

	const selectToolButton = new UIButton();
	selectToolButton.dom.className = 'Button selected';
	selectToolButton.dom.appendChild( selectToolIcon );
	selectToolButton.onClick( function () {

		console.log("selectToolButton Clicked")
		editor.setTool(new SelectTool());
		signals.toolChanged.dispatch( 'selectTool' );
		//signals.transformModeChanged.dispatch( 'lineTool' );

	} );
	container.add( selectToolButton );

	editor.setTool(new SelectTool());
	signals.toolChanged.dispatch( 'selectTool' );

	const lineToolIcon = document.createElement( 'img' );
	lineToolIcon.title = strings.getKey( 'toolbar/translate' );
	lineToolIcon.src = 'images/line.svg';

	const lineToolButton = new UIButton();
	lineToolButton.dom.className = 'Button';
	lineToolButton.dom.appendChild( lineToolIcon );
	lineToolButton.onClick( function () {

		console.log("LineToolButton Clicked")
		editor.setTool(new LineTool());
		signals.toolChanged.dispatch( 'lineTool' );
		//signals.transformModeChanged.dispatch( 'lineTool' );

	} );
	container.add( lineToolButton );

	// translate / rotate / scale

	const translateIcon = document.createElement( 'img' );
	translateIcon.title = strings.getKey( 'toolbar/translate' );
	translateIcon.src = 'images/translate.svg';

	const translate = new UIButton();
	translate.dom.className = 'Button';
	translate.dom.appendChild( translateIcon );
	translate.onClick( function () {

		editor.setTool(new MoveTool());
		signals.toolChanged.dispatch( 'moveTool' );
		signals.transformModeChanged.dispatch( 'translate' );

	} );
	container.add( translate );

	const rotateIcon = document.createElement( 'img' );
	rotateIcon.title = strings.getKey( 'toolbar/rotate' );
	rotateIcon.src = 'images/rotate.svg';

	const rotate = new UIButton();
	rotate.dom.appendChild( rotateIcon );
	rotate.onClick( function () {

		signals.toolChanged.dispatch( 'rotateTool' );
		//signals.transformModeChanged.dispatch( 'rotate' );

	} );
	container.add( rotate );

	const scaleIcon = document.createElement( 'img' );
	scaleIcon.title = strings.getKey( 'toolbar/scale' );
	scaleIcon.src = 'images/scale.svg';

	const scale = new UIButton();
	scale.dom.appendChild( scaleIcon );
	scale.onClick( function () {

		signals.toolChanged.dispatch( 'scaleTool' );
		//signals.transformModeChanged.dispatch( 'scale' );

	} );
	container.add( scale );

	const local = new UICheckbox( false );
	local.dom.title = strings.getKey( 'toolbar/local' );
	local.onChange( function () {

		signals.spaceChanged.dispatch( this.getValue() === true ? 'local' : 'world' );

	} );
	container.add( local );

	//
	signals.toolChanged.add( function ( mode ) {

		selectToolButton.dom.classList.remove( 'selected' );
		lineToolButton.dom.classList.remove( 'selected' );

		translate.dom.classList.remove( 'selected' );
		rotate.dom.classList.remove( 'selected' );
		scale.dom.classList.remove( 'selected' );

		switch ( mode ) {

			case 'selectTool': selectToolButton.dom.classList.add( 'selected' ); break;
			case 'lineTool': lineToolButton.dom.classList.add( 'selected' ); break;

			case 'moveTool': translate.dom.classList.add( 'selected' ); break;
			case 'rotateTool': rotate.dom.classList.add( 'selected' ); break;
			case 'scaleTool': scale.dom.classList.add( 'selected' ); break;

		}

	} );
	signals.transformModeChanged.add( function ( mode ) {

		lineToolButton.dom.classList.remove( 'selected' );

		translate.dom.classList.remove( 'selected' );
		rotate.dom.classList.remove( 'selected' );
		scale.dom.classList.remove( 'selected' );

		switch ( mode ) {

			case 'lineTool': lineToolButton.dom.classList.add( 'selected' ); break;

			case 'translate': translate.dom.classList.add( 'selected' ); break;
			case 'rotate': rotate.dom.classList.add( 'selected' ); break;
			case 'scale': scale.dom.classList.add( 'selected' ); break;

		}

	} );

	return container;

}

export { Toolbar };
