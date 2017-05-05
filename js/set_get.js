//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// change function for selectmenu
//
"use strict";


//
//     S P E E D
//
function speedChanged( event, ui ) {
	cl("speedChanged");
	setSpeedTo(parseInt(ui.item.value));
}
function hideSpeed() {
	glob.showSpeed=false;
	redraw();
}
function setSpeedTo(newspeed, silent) {
	var silent = silent || false;
	cl("setSpeedTo:"+newspeed);
	glob.speed = newspeed;
	if (!silent) {
		// show speed on canvas
		glob.showSpeed=true;
		// revove existing timeouts
		clearTimeout(speedTimeout);
		// set new timeout
		speedTimeout = setTimeout(hideSpeed, 700);
	}

	// sets the select menu
	if(ui) {
		$("#speedButton").val(newspeed).selectmenu("refresh");
	}
	// sets also t_draw
	var levels = [1,3,10,20,50,100,250,500,1000,2000, 3000];
	NumPar.pars["t_draw"].set(levels[newspeed]);
	redraw(); 
}
function modelChanged( event, ui ) {
 setModelTo(ui.item.value);
}


//
//     D I S T R I B U T I O N
//

 function setDistributionTo(newpd) {
	//cl("setDistributionTo "+newpd);
	if (ui) {
		$("#probDist").val(newpd).selectmenu("refresh");
	}
	var prevpd = curpd;
	pds[prevpd].ready = false; // for 3D
	curpd = newpd;	 
 	if (nn.isLBGX) {
		init_discrete_set("nextPD");
	} else {
		if (glob._3DV) {
			M3D.clearSignals();
		}
	}
	if ((!glob.showAutoRestart || glob.touch)&&!(prevpd===curpd)) {
		flashN(1,"Distribution: "+newpd,2000);
	}
	redraw();	
	if (glob.touch) {
		// delay reactions in case of touch beeing active (more change may come ....)
		if (glob.restartAfterPDChange || !VBNN.models[nn.model].staysAdaptive){
			if (distTimeout) {
				clearTimeout(distTimeout);
			}
			distTimeout = setTimeout(restartFun, 300);
		} else if (glob.startAfterPDChange) {
			if (distTimeout) {
				clearTimeout(distTimeout);
			}
			distTimeout = setTimeout(startFun, 300);
		}
	} else if (glob.restartAfterPDChange) {
		restartFun(); // reset and start
	} else if (glob.startAfterPDChange){
		startFun(); // just start
	} else {
		  // do nuttin .....
	}
	nn.castPD();
}
function prevPD(e) {
	// if we have an event then the user deliberately changes the distribution
	// in this case (and from then on) we should allow all distributions
	if (typeof e !== "undefined"){
		if (glob.nonstat) {
			Par.set("nonstat",false);
		}				
	}
	_nextPD(-1);
}

function nextPD(e) {
	// if we have an event then the user deliberately changes the distribution
	// in this case (and from then on) we should allow all distributions
	if (typeof e !== "undefined"){
		if (glob.nonstat) {
			Par.set("nonstat",false);
		}				
	}
	_nextPD(1);
	
}

// TODO: extend to also make nextPD("Circle") possible
function _nextPD(delta) {
	// which direction (1:next, -1:previous)
	var delta = delta || 1;
	var options = $('#probDist option');
	var values = $.map(options ,function(option) {
			return option.value;
	});
	if(!VBNN.models[curmodel].staysAdaptive) {
		// stop rotation for converging models
		Par.set("showRotate",false);
	}
	var found = false; // suitable PD found?
	var newind = values.indexOf(curpd)+values.length;;
	while (!found) {
		newind = (newind+values.length+delta)%values.length;
		var newpd = values[newind];
		if(glob.matchingPDs && !VBNN.models[curmodel].staysAdaptive) {
			// look for stationary PD, since model has decaying pars
			if (pds[newpd].stationary){
				found=true;
			}
		} else {
			// any PD
			if (glob.nonstat) {
				// we want only non-stationary ones ....
				if (!pds[newpd].stationary || (glob.showRotate && !pds[newpd].rotationSymmetric)){
					found=true;
				}
			} else {
				found = true;
			}
		}
	}
	//cl("setdisto "+newpd);
	setDistributionTo(newpd);
}

 function pdChanged( event, ui ) {
	 curpd = ui.item.value;
	 console.log("curpd ="+curpd+"    evt:" + event);
	 //cd(ui);
	 setDistributionTo(ui.item.value);
 }
 
 
 
//
//     M O D E L
//

//
// sets curmodel .....
//
function setModelTo(newmodel) {
    cl(" ------------------- setModelTo("+newmodel+")---------------");
	cl("model changes from '"+curmodel + "' to '" + newmodel+"'");
	// hide stuff for current model
	var tmp = "";
	$(".modelparams").hide();
	var basemodel = VBNN.models[newmodel].basemodel;
	if (basemodel) {
		// rather show the basemodel section
		$("#"+basemodel).show();
	} else {
		// show the model section
		$("#"+newmodel).show();
	}
	 // actually set newmodel
	var prevmodel = curmodel;
	
	curmodel = newmodel; // update current model name
	if (ui) {
		$("#model").val(newmodel).selectmenu("refresh");
	}
	var linki = "<div class='parheader'><span class='modname'>"+newmodel+"</span> parameters and settings </div><div id='reffi'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href='"+VBNN.models[newmodel].detlink+"' target=_blank>Model Details</a></div>";
	//cl(linki);
	$("#reference").html(linki);
	if (prevmodel==='' || !VBNN.compatible(prevmodel,curmodel)) {
		// all new or incompatible......
		resetFun("setModelTo");
		if (curmodel === "GNG" || curmodel === "GNG-U") {
			LogPar.pars.gng_doUtility.set(curmodel === "GNG-U");
            LogPar.pars.gng_delOrphanedNodes.set("GNG" === curmodel);
        }
		M3D.showEdgesFun();
		M3D.showTraceEdgesFun();
		if (VBNN.nameIsLBGX(curmodel)) {
			cl("cur is LBGX")
			M3D.showSignalsFun();
			M3D.showTraceEdgesFun();
		}
		if (VBNN.nameIsLBGX(prevmodel)) {
			cl("prev is LBGX")
			M3D.showSignalsFun();
			M3D.showTraceEdgesFun();
		}
		if (glob.restartAfterModelChange && !glob.alt){
			if (glob.touch) {
				// schedule restart
				cl(".... TOUCH ....");
				if (modelTimeout) {
					clearTimeout(modelTimeout);
				}
				modelTimeout = setTimeout(restartFun, 500);
			} else {
				cl("autostart .....");
				startFun();
			}
		} else {
			cl("no autostart since no flag set or ALT pressed .....");
		}
	} else {
		cl("new model compatible ......");
		// prevmodel && compatible
		if (curmodel === "GNG" || curmodel === "GNG-U") {
			LogPar.pars.gng_doUtility.set(curmodel === "GNG-U");
            LogPar.pars.gng_delOrphanedNodes.set("GNG" === curmodel);
        }
		
		if (VBNN.nameIsLBGX(curmodel)) {
			cl("yes, isLBGX: " + curmodel);
			LogPar.pars.lbg_doUtility.set(curmodel === "LBG-U");
		} else {
			cl("no, not isLBGX: " + curmodel);
		}
		nn.model=curmodel;
		nn.draw();
		if (curmodel === "LBG-U") {
			if (glob.touch) {
				if (modelTimeout) {
					clearTimeout(modelTimeout);
				}
				modelTimeout = setTimeout(function () {startFun();}, 500);
			} else {
				cl("undo conversion, startFun for "+curmodel)
				nn.converged = false;
				startFun();
			}
		}
		cl("no autostart since compatible .....");
	}
	flashN(1,"Model: "+curmodel,2000,0.0,0);

}

function prevModel() {
	// if we have an event then the user deliberately changes the model
	// in this case (and from then on) we should allow all distributions
	if (typeof e !== "undefined"){
		if (glob.nonstat) {
			Par.set("nonstat",false);
		}				
	}
	_nextModel(-1);
}

function nextModel() {
	// if we have an event then the user deliberately changes the model
	// in this case (and from then on) we should allow all distributions
	if (typeof e !== "undefined"){
		if (glob.nonstat) {
			Par.set("nonstat",false);
		}				
	}
	_nextModel(1);
}


function _nextModel(delta) {
	cl("nextModel(delta) delta = " + delta);
	// which direction (1:next, -1:previous)
	var delta = delta || 1;
	cl("nextmodel: delta = "+delta);
	// select all options of select "model"
	var options = $('#model option');
	// getg all option values
	var values = $.map(options ,function(option) {
			return option.value;
	});
	var newind = (values.indexOf(curmodel)+values.length+delta)%values.length;
	var newmodel = values[newind];
	//curmodel = newmodel;
	setModelTo(newmodel);
}
function setSpeedToButton(newSpeed) {
	cl("setSpeedToButton");
	if (ui) {
		$("#speedButton").val(newSpeed).selectmenu("refresh");
	}
	setSpeedTo(newSpeed);
}
function prevSpeed(e) {
	_nextSpeed(-1);
	if (typeof e !== "undefined"){
		if (glob.showSingleStep){
			Par.set("showSingleStep", false);
			startFun();
		}
	}
}

function nextSpeed(e) {
	// if we have an event then the user deliberately changes the speed
	// in this case we should end single step mode
	_nextSpeed(1);
	if (typeof e !== "undefined"){
		if (glob.showSingleStep){
			Par.set("showSingleStep", false);
			startFun("nextSpeed");
		}
	}
}

function _nextSpeed(delta) {
	cl("nextSpeed(delta) delta = " + delta);
	// which direction (1:next, -1:previous)
	var delta = delta || 1;
	// select all options of select "model"
	var options = $('#speedButton option');
	// getg all option values
	var values = $.map(options ,function(option) {
			return option.value;
	});
	var newind = values.indexOf($("#speedButton").val())+delta;
	var add = "";
	if (newind < 0) {
		newind = 0;
		add = " (min.)"
	}
	if (newind >= values.length) {
		newind = values.length-1;
		add = " (max.)"
	}
	var newspeed = values[newind];
	var myspeed=glob.speed+delta;
	cl("myspeed = "+myspeed);
	add = "";
	if (myspeed > 8){
		myspeed = 8;
		add = " (max.)"
	}
	if (myspeed <0) {
		myspeed = 0;
		add = " (min.)"
	}
	flashN(1,"Speed: " + myspeed +" of 8 " + add);
	setSpeedToButton(myspeed);
}

//
// set view mode and show/hide appropriately
//
function getViewMode() {
	return glob.viewMode;
}
function setViewMode(m) {
	if (!isIn(m,glob.viewModes)) {
		cl("invalid viewmode: "+m);
	} else {
		//if (m!=glob.viewMode) {
			glob.viewMode = m;
			cl("setViewMode(): viewmode set to "+m);
			
			switch (m) {
			case "desktop":
				$("#mycanvas").css("left","0px");
			    $("#showguibut").hide();
			    $("#hideguibut").show();
				// no aux navigation
				$("#div3H").hide();
				$("#div3Hs").hide();
				if (!mini) {
					$( "#root").show();
					/*
					if (isMobile.any()) {
						cl("hide ads due to mobile: "+mobileReason);
						$("#ads").hide();
					} else {
						$("#ads").width(200);
						$("#ads").height(600);
						$("#ads").show();
					}
					*/
				}
			break;
			case "embedded":
				if (!mini && !isMobile.isSmall()) {
					// aux navigation
					$("#mycanvas").css("left","180px");
					$("#div3H").show();
					$("#div3Hs").hide();
				} else {
					// nothing (trap)
					$("#mycanvas").css("left","0px");
					$("#div3H").hide();
					$("#div3Hs").hide();
				}
			    $("#hideguibut").hide();
			    $("#showguibut").show();
				$( "#root").hide();
				/*
				$("#ads").show();
				$("#ads").width(200);
				$("#ads").height(600);
				*/
			break;
			}
			handleResize(true); // keep viewMode
			handleResize2(); // for div3H
			redraw();
	}
}

function showEdges () {
	Par.set("showEdges",true);
	redraw();
}
function showNodes () {
	Par.set("showNodes",true);
	redraw();
}
function showSigs () {
	Par.set("showSignals",true);
	redraw();
}
