//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

"use strict";

cl("callin' the ole M3D");
M3D(1000,4000);

//
// FINAL CALL
//
$(function() {
	cl("****************** POSTFUN CHECKBOX init (ME) *********************");

	globalInit();
	cl("me is ready (demogng.js) ....."); 
	cl("screen.width"+screen.width);
	cl("screen.height"+screen.height);
	cl("Mobile:",isMobile.any());

	// ensure that canvas gets focus for hotkeys
	//$("#mycanvas").contextmenu(function(e) {conti(e)});
	
	$("#mycanvas").mouseenter(function() {
		$("#mycanvas").focus();
		glob.touch=false;
		//cl('$("#mycanvas").focus();');
		});
		
	$("#mycanvas").mouseleave(function() {
		$("#mycanvas").blur(); // lose focus :-)
		killGrabbedNode(); // make sure that mouse is up then
		//cl('$("#mycanvas").blur();');
		});
	// ensure that canvas gets focus for hotkeys
	//$("#mycanvas").contextmenu(function(e) {conti(e)});
	
	$("#div3d").mouseenter(function() {
		$("#div3d").focus();
		glob.touch=false;
		//cl('$("#div3d").focus();');
		controls.enableKeys = true;
		});
		
	$("#div3d").mouseleave(function() {
		$("#div3d").blur(); // lose focus :-)
		killGrabbedNode(); // make sure that mouse is up then
		//cl('$("#div3d").blur();');
		controls.enableKeys = false;
		//window.addEventListener( 'keydown', dummyKey, true);
		});
		
	//
	// initialize the image buttons
	//
	cl("****************** DONE:  CHECKBOX init (ME) *********************");
	cl("****************** ME READY *********************");
	if (ui) {
		$( ".optionGroup" ).buttonset();
	}
	
	// compute distribution outlines and field lists
	//computeFieldList("Raster2");
	computeFieldList("Clusters");
	computeFieldList("Clusters2");
	computeFieldList("Clusters3");
	computeFieldList2("Spiral");
	computeOutline("Spiral");
	computeFieldList2("Cactus");
	computeOutline("Cactus");
	computeFieldList2("Cloud");
	computeOutline("Cloud");

	
	cl("****************** gensliders() 2 *********************");
	//
	// generate sliders for all numeric variables
	//
	for (var numi in NumPar.pars) {
		NumPar.pars[numi].genslider()();
	}

    cl("****************** doSpinners() 2 *********************");
	//
	// add spinners for all numeric variables
	//
	for (var numi in NumPar.pars) {
		NumPar.pars[numi].doSpinner()();
	}
	
    cl("****************** doSpinners() done *********************");
	//
	// initialize model 
	//
	var initialModel = "GNG-U";
	cl("initialModel = "+initialModel);
	
	//
	// initialize mode
	//
	var initialViewMode = "desktop";
	if (queryDict.hasOwnProperty('mode') ) {
		//
		// viewMode given via GET-Parameter, use it
		//
		var distributions = Object.keys(pds);
		var m = queryDict.mode;
		if (isIn(m,glob.viewModes)){
			// is a valid mode
			setViewMode(m);
		}
	} else {
		//
		// no viewmode given, set based on screensize
		//
		if (isMobile.any()) {
			setViewMode("embedded");
		} else {
			setViewMode("desktop");
		}
	}
	cl("me ready: glob.viewMode: ",glob.viewMode);
	
	var pdsel = document.getElementById("probDist");
	var allpds = [];
	for (var i in pds){
		allpds.push(i);
		var jq = false;
		if (jq) {
			//$("#probDist").append(new Option(i, i));
		} else {
			var e = document.createElement("option");
			var o = new Option(i,i);
			o.innerHTML = i; 
			pdsel.appendChild(o);
		}
	}
	cl(allpds);
	//
	// set up selectmenus
	//
	if(ui) {
		$("#probDist").selectmenu({ change: pdChanged, width: 270});
		$("#model").selectmenu({ change: modelChanged, width: 270});
		$("#speedButton").selectmenu({ change: speedChanged, width: 270});
	}
	$("#XY").hide();
	$("#hiddenWindow").hide();

	// formatting all labels
	$('label').css([".ui-widget-content"]);
	
	
	// set initial speed
	setSpeedTo(8);
	
	cl("handle GET params ...........");
	// abbreviations for param names
	var trans = {
		"flash": "showCanvasMessages",
	}
	var desiredModel ="";
	var desiredDistribution ="";
	for (var parname in queryDict) {
		var valu = queryDict[parname]
		cl("GET:"+parname+" ----> " + valu);
		if (Par.exists(parname)) {
			if (parname === "model") {
				desiredModel = valu; // create later
			} else if (parname === "distribution") {
				desiredDistribution = valu; // create later
			} else {
				Par.set(parname,valu);
			}
		} else if (parname in trans)  {
			var parname2 = trans[parname];
			if (Par.exists(parname2)) {
				Par.set(parname2,valu);
			} else {
				cl("NOT FOUND 2 in predefined parameters: "+parname2);
			}
		} else {
			cl("NOT FOUND in predefined parameters: "+parname);	
		}
    }
	
    if (glob._3DV) {
		show3D();
	} else {
		hide3D();
	}
	
	if (desiredModel!="") {
		initialModel=desiredModel
	}
	//
	// initialize PD
	//
	if (desiredDistribution!="") {
		var initialDistribution=desiredDistribution
	} else if (!VBNN.models[initialModel].staysAdaptive) {
		switch(Math.floor(Math.random()*6)) {
			case 0:	 initialDistribution = "UnitSquare"; break;
			case 1:	 initialDistribution = "Circle"; break;
			case 2:	 initialDistribution = "Cactus"; break;
			case 3:	 initialDistribution = "H-Stripe"; break;
			case 4:	 initialDistribution = "Cloud";break;
			case 5:	 initialDistribution = "Corners"; break;
			break;
		}
	} else {	
	    initialDistribution = allpds[Math.floor(Math.random()*allpds.length)]
		/*
		switch(Math.floor(Math.random()*6)) {
			case 0:	 initialDistribution = "PulsingCircle-N"; break;
			case 1:	 initialDistribution = "Circle-N"; break;
			case 2:	 initialDistribution = "Square-N"; break;
			case 3:	 initialDistribution = "H-Stripe-N"; break;
			case 4:	 initialDistribution = "Cactus";
					 Par.set("showRotate",true);
					 break;
			case 5:	 initialDistribution = "Corners-N"; break;
			break;
		}
		*/
	}
	
	curpd = initialDistribution;
	cl("initialDistribution = "+initialDistribution);

	// set initial model
	setModelTo(initialModel);
	
	// set initial distribution
	setDistributionTo(initialDistribution);
	
	if (!VBNN.models[initialModel].staysAdaptive && !pds[initialDistribution].stationary) {
		cl("nextpd called for model " + initialModel + " since " + initialDistribution + "is not stationary ....");
		nextPD();
	}

	if (desiredModel!="") {
		initialModel=desiredModel;
	}
	// get the layout right
	handleResize();
	
	// set-up help window
	for (var i in kk) {
		var classi = "";
		if (kk[i].substring(0,4)==="(3D)"){
			classi = " class='H3D'"
		}
		if (kk[i].substring(0,4)==="(2D)"){
			classi = " class='H2D'"
		}
		$("#canvaskeys").append('<tr'+classi+'><td align="right"><span  class="mybox">'+i+"</span></td><td>"+kk[i]+'</td></tr>');
	}
	for (var i in tips) {
		var classi = "";
		if (tips[i].substring(0,4)==="(3D)"){
			classi = " class='H3D'"
		}
		if (tips[i].substring(0,4)==="(2D)"){
			classi = " class='H2D'"
		}
		$("#canvaswheel").append('<tr'+classi+'><td align="right"><span  class="mybox">'+i+"</span></td><td>"+tips[i]+'</td></tr>');
	}
	/*
	for (var i =0;i<tips.length;i++) {
		$("#tips").append("<li>"+tips[i]+"</li>");
	}
	*/
	//
	// touch in a few lines .....
	//
	
	// touch for webkit
	can2D.addEventListener('touchstart', function(e) {
		e.preventDefault();
		//glob.touchUsed = false;
		glob.realTouchContact = true;
		var cc = getCanvasCoords();
		var touchPos = e.touches[0];
		var evt = {
			button: 0,
			offsetX: touchPos.pageX-cc.x,
			offsetY: touchPos.pageY-cc.y,
		};
		mousedownhandler(evt);
	}, false);
	
	can2D.addEventListener('touchmove', function(e) {
		e.preventDefault();
		var cc = getCanvasCoords();
		var touchPos = e.touches[0];
		glob.touchMoved = true; // finger has moved from initial position
		var evt = {
			button: 0,
			offsetX: touchPos.pageX-cc.x,
			offsetY: touchPos.pageY-cc.y,
		};
		mousemovehandler(evt);
	}, false);
	
	can2D.addEventListener('touchend', function(e) {
		e.preventDefault();
		var cc = getCanvasCoords();
		var touchPos = e.touches[0];
		var evt = {
			button: 0,
		};
		mouseuphandler(evt);
	}, false);
	// possibly hide ads
	if (glob.noads) {
		cl("no ads due to noads option");
		$("#ads").hide();
	}
	document.body.style.overflow = 'hidden';
	document.getElementById("mycanvas").onblur = function() {
	}
	document.getElementById("mycanvas").onfocus = function() {
	}
	if (ui) {
		$("#showRotate").button("enable");
	}

	startFun(); // A U T O S T A R T  autostart AUTOSTART
	var my_image = new Image();
	// preload images for offline usage
	//my_image.src = 'bigearth.jpg';
	var myim = "AutoRestart.png \
	AutoRestart_gs.png \
	PDs.png \
	PDs_gs.png \
	Edges.png \
	Edges_gs.png \
	Fields.png \
	Fields_gs.png \
	Nodes.png \
	Nodes_gs.png \
	Signals.png \
	Signals_gs.png \
	SingleStep.png \
	SingleStep_gs.png \
	Trace.png \
	Trace_gs.png \
	Voronoi.png \
	Voronoi_gs.png";
	var mmm=myim.split(/\s*[\s]\s*/);
	//cl(	mmm);
	for (var i = 0; i< mmm.length;i++) {
		 cl("preload: "+mmm[i]);
		 my_image.src = "images/"+mmm[i];
	};
    adaptHelp();
	$("#div3H").draggable();
	$("#div3Hs").draggable();
	$(".flashy").draggable();
	M3D.showUnitCubeFun();
	M3D.showPlaneFun();
	M3D.showAxesFun();
	M3D.showFrameFun();
	M3D.showNodesFun();
	M3D.showSignalsFun();
	M3D.showEdgesFun();
	M3D.showPDsFun();

	/*
	// set background images
	for (var i in imis) {
		var x = imis[i];
		var basename = x.substring(4);
		if (glob[x]) {
			cl("dooo "+x+" "+"url(images/"+basename+".png)");
			$(x).css('background-image',"url(images/"+basename+".png)")
		} else {
			cl("dooont "+x+" "+"url(images/"+basename+"_gs.png)");
			$(x).css('background-image',"url(images/"+basename+"_gs.png)")
		}
	}
	*/
})
