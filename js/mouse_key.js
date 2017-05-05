//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// mouse and key handling
//
"use strict";
function startTheGrab(bmu){
	$('#mycanvas').css('cursor', 'grabbing');
	glob.isgrabbing = true;
	glob.grabbedNode=bmu;
	for (var i in glob.grabbedNode.neighbors){
	  glob.grabbedNode.neighbors[i].color="white" /*glob.colors.grabNeighbor*/;
	}
	repaint();
	grabTimeout = "";
}

function startThePDGrab(mouseP) {
	var pd = pds["DragMe"];
	$('#mycanvas').css('cursor', 'grabbing');
	glob.isPDgrabbing = true;
	pd.xoff_m=mouseP.x-pd.xoff;
	pd.yoff_m=mouseP.y-pd.yoff;
	repaint();
	grabTimeout = "";
	
}

function mousedownhandler( event ) {
	if (event.button != 0) return; // 0 = left-button
	// USE CURRENT MOUSE POS AS AN INPUT SIGNAL
	mousePos.setTo(xscaleR(event.offsetX),yscaleR(event.offsetY));
	
	
	glob.clickActive = true;
	clearTimeout(clickTimeout);
	clickTimeout = setTimeout(function() { glob.clickActive = false;}, 200); // click fast
	
	glob.touchUsed = false;
	var bmu = nn.findBMU(mousePos);
	
	if (!glob.showTouchHelp && glob.allowGrab) {
		// check if over a node
		if (curpd=="DragMe" && overDragRect(mousePos)){
			startThePDGrab(mousePos);
				// start grabbing action after some waiting period!
				// clearTimeout(grabTimeout);
				// grabTimeout = setTimeout(function() { startThePDGrab(mousePos)}, 200); //forceStop	in start_inr		
		} else {
			if (bmu.position.dist(mousePos) <= xscaleR(glob.nodeDiameter*3)){
				// we are close
				// start grabbing action after some waiting period!
				clearTimeout(grabTimeout);
				grabTimeout = setTimeout(function() { startTheGrab(bmu)}, 200); //forceStop	in start_inr
				/*
				$('#mycanvas').css('cursor', 'grabbing');
				glob.isgrabbing = true;
				glob.grabbedNode=bmu;
				for (var i in glob.grabbedNode.neighbors){
				  glob.grabbedNode.neighbors[i].color="white" / *glob.colors.grabNeighbor* /;
				}
				repaint();
				*/
				  
			} else {
				// we are not close
				$('#mycanvas').css('cursor', 'default');
				glob.isgrabbing = false;
				if (glob.doPing) {
					pingedNode=bmu;
					pingedNode.color = "red" /*glob.colors.pinged*/;
					for (i in pingedNode.neighbors){
						pingedNode.neighbors[i].color="white" /*glob.colors.pingedNeighbor*/;
					}
				}
				repaint();
			}
		}
	}
	if (!glob.isgrabbing) {
		//$('#mycanvas').css('cursor', 'crosshair');
		glob.touch = true; // we have entered a touch action
		glob.touchMoved = false; // no motion yet
		glob.touchpos = []; // .... and no recorded touch positions
		glob.touchpos.push(new Vector(xscaleR(event.offsetX),yscaleR(event.offsetY)));	
	}
}
function overDragRect(p){
	var pd = pds["DragMe"]
	if ((p.x >= pd.xoff)&&(p.x <= pd.xoff+pd.width)&&
	    (p.y >= pd.yoff)&&(p.y <= pd.yoff+pd.height)) 
	{
		return true;
	} else {
		return false
	}
}

function mousemovehandler( event ) {
	// find closest unit and highlight
	// for drag move this unit
	// loop over all nodes
	clearTimeout(grabTimeout);
	var grab_cursor = false;
	mousePos.setTo(xscaleR(event.offsetX),yscaleR(event.offsetY));
	var msg = "Handler for .mousemove() called at ";
	//cl(msg);
	//cd(mousePos);
	if (!(glob.isgrabbing || glob.isPDgrabbing)&& glob.touch) {
		$('#mycanvas').css('cursor', 'crosshair');
	}
	if (!glob.showTouchHelp && glob.allowGrab) {
		if (glob.isPDgrabbing) {
			var pd = pds["DragMe"];
			pd.xoff=mousePos.x-pd.xoff_m;
			pd.yoff=mousePos.y-pd.yoff_m;
			repaint();
		} else if (glob.isgrabbing) {
			// move the grabbed node
			glob.grabbedNode.position.copyFrom(mousePos);
			repaint();
		} else {
			// not grabbing currently
			if (!glob.touch) {
				if (curpd=="DragMe" && overDragRect(mousePos)){
					$('#mycanvas').css('cursor', 'grab');
					grab_cursor = true;					
				} else if (nn) {
					// not grabbing
					var bmu = nn.findBMU(mousePos);
					//cl("mousemovehandler() bmu: "+bmu.id+" err:"+bmu.error+" u:"+bmu.utility);
					if (bmu.position.dist(mousePos) <= xscaleR(glob.nodeDiameter*2)){
						// we are close
						// change cursor to open hand
						$('#mycanvas').css('cursor', 'grab');
						grab_cursor = true;
					} else {
						// we are not close
						$('#mycanvas').css('cursor', 'default');
					}  
				} else {
					cl("movie: no nn");
				}
			}
		}
	}
	if (!(glob.isgrabbing||glob.isPDgrabbing)) {
		if (glob.touch) {
			glob.touchMoved = true;
			glob.touchpos.push(new Vector(xscaleR(event.offsetX),yscaleR(event.offsetY)));	
			evalMove();	
		} else if (!grab_cursor) {
			var found = false;
			var button_rad = 0.1;
			for (var m in magic) {
				var dissi = mousePos.dist(magic[m].v);
				if (dissi<button_rad) {
					found = true;
					var foundWhat = m;
				}	
			}
			if (found) { 
				if ($('#mycanvas').css('cursor') != "cell") {
					$('#mycanvas').css('cursor', 'cell');
				}
			} else {
				$('#mycanvas').css('cursor', 'default');
			}
		}
	}
}
function mouseuphandler( event ) {
	if (event.button != 0) return;
	//mousePos.setTo(xscaleR(event.offsetX),yscaleR(event.offsetY));
	var bmu = nn.findBMU(mousePos);

	glob.isgrabbing = false;
	var wasPDgrabbing = (true ===glob.isPDgrabbing);
	glob.isPDgrabbing = false;
	glob.touch=false;
	glob.realTouchContact = false;
	var grab_cursor = false;
	if (glob.allowGrab) {
		if (!wasPDgrabbing) {
			if (glob.grabbedNode){
				// grabbed node present, release it, delete if outside!
				glob.grabbedNode.restore();

				var i;
				for (i in glob.grabbedNode.neighbors){
					glob.grabbedNode.neighbors[i].restore();
				}
				if (mousePos.x <0 || mousePos.x >1 || mousePos.y <0 || mousePos.y >1) {
					killGrabbedNode();
				}
				glob.grabbedNode = undefined;
			} else {
				// currently no grabbed node
				evalMove();	
			}
		}
		if (!isMobile.any()) {
			if (wasPDgrabbing || bmu.position.dist(mousePos) <= xscaleR(glob.nodeDiameter*2)){
				// we are close
				$('#mycanvas').css('cursor', 'grab');
				grab_cursor = true;
			}  else {
				$('#mycanvas').css('cursor', 'default');
			}
		}
	} else {
		evalMove();	
	}
	if (!wasPDgrabbing) {
		$('#mycanvas').css('cursor', 'default');
	}
	if (!isMobile.any() && !grab_cursor) {
		var found = false;
		var button_rad = 0.1;
		for (var m in magic) {
			var dissi = mousePos.dist(magic[m].v);
			if (dissi<button_rad) {
				found = true;
			}	
		}
		if (found) { 
			$('#mycanvas').css('cursor', 'cell');
		} else {
			$('#mycanvas').css('cursor', 'default');
		}
	}
	if (glob.doPing) {
		if (pingedNode){
			pingedNode.restore();

			var i;
			for (i in pingedNode.neighbors){
			  pingedNode.neighbors[i].restore();
			}
			pingedNode = undefined;
		}
	}
	//glob.grabbedNode = undefined;
	repaint();
}

//
// info for shortcut keys
//
var kk = {
	"(Esc)":"reset simulation",
	"(space)":"start/stop simulation",
	a: "auto-restart on/off",
	e: "edges display on/off",
	f: "freeze structure on/off",
	h: "key help window on/off",
	//i: "stop-after-insert",
	m: "display frames rate (fps) on/off",
	n: "nodes display on/off",
	o: "dist. rotate on/off",
	p: "parameter window on/off",
	r: "restart simulation",
	s: "signals display on/off",
	t: "trace display on/off",
	v: "(2D) Voronoi display on/off",
	x: "(3D) x-rotation on/off",
	y: "(3D) y-rotation on/off",
	z: "(3D) z-rotation on/off",
	"(up)":"(2D) prev. model",
	"(down)":"(2D) next model",
	"(left)":"(2D) prev. distribution",
	"(right)":"(2D) next distribution",
	1: "toggle GUI mode",
	3: "toggle 2D/3D mode",
//	4: "utitility display  on/off (GNG)",
//	5: "freeze structure (GNG)"
};

var tips = {
	"wheel up":"(2D) prev. distribution",
	"wheel down":"(2D) next distribution",
	"wheel up ":"(3D) zoom in",
	"wheel down ":"(3D) zoom out",
	//"Alt+wheel up":"prev. model",
	//"Alt+wheel down":"next model"
};
	
	
	

function doKeyDown(e) {
	cl("keydown .....");
	//if ("preventDefault" in e){
	if (typeof(e) !== "string") {
		cl("preventDefault");
		e.preventDefault(); // stop key event to bubble up!
	}
	ml(typeof(e));
	var key;
	var keyCode;
	if (typeof(e) === "string") {
		// dual use
		ml("string: '"+e+"'");
		key = e;
		keyCode=e;
	} else {
		//alert(e.keyCode);
		console.log("key"+String.fromCharCode(e.keyCode)+ "  keycode: "+e.keyCode);
		var key = String.fromCharCode(e.keyCode);
		var keyCode = e.keyCode;
	}

	switch (key) {
		case "0": 
			Node.prototype.draw = Node.prototype.drawbare;
			redraw();		
		break;
		case "1": 
		if (getViewMode() === "embedded") {
			setViewMode("desktop"); 
		} else {
			setViewMode("embedded"); 
		};
		break;
		case "3": 
			Par.toggle("_3DV");
			//Par.toggle("gng_showError");
			redraw();		
		break;
		case "4": 
			Par.toggle("gng_showUtility");
			redraw();		
		break;
//		case "5": 
//			Par.toggle("freezeStructure");
//			redraw();		
//		break;
		case "9": 
			Node.prototype.draw = Node.prototype.drawfull;
			redraw();		
		break;
		//case "D": debug = !debug; repaint(); cl("debug:"+debug);break;
		case " ": 	if (glob.shouldStop) {
						startFun();
					} else {
						terminateModes();
						stopFun();
						redraw();
					}			
		break;
		case "A": $("#showAutoRestart").trigger("click"); break;
		case "E": $("#showEdges").trigger("click"); break;
		case "F": Par.toggle("freezeStructure"); redraw(); break;
		case "H": $("#keyhelpWindow").toggle(); break;
//		case "I": glob.shouldStopAfterInsert = !glob.shouldStopAfterInsert;
//					cl("glob.shouldStopAfterInsert:"+glob.shouldStopAfterInsert);break;
		case "#": 
		case "M":
			Par.toggle("displayFPS"); break;
		case "N": $("#showNodes").trigger("click"); break;
		case "O": $("#showRotate").trigger("click"); break;
		case "P": $("#settingsWindow").toggle(); break;
		case "R": restartFun(); break;
		case "S": $("#showSignals").trigger("click"); break;
		case "T": $("#showTrace").trigger("click"); break;
		case "U": glob.gng_doUtility = !glob.gng_doUtility; console.log("gng_doUtility:",glob.gng_doUtility); break;
		case "V": $("#showVoronoi").trigger("click"); break;
		case "X": Par.toggle("_3DROT_X"); if (glob._3DROT_X) {stamp_x = realtime}; redraw(); break;//snapshot(); break;
		case "Y": Par.toggle("_3DROT_Y"); if (glob._3DROT_Y) {stamp_y = realtime};redraw(); break;//snapshot(); break;
		case "Z": Par.toggle("_3DROT_Z"); if (glob._3DROT_Z) {stamp_z = realtime};redraw(); break;//snapshot(); break;
		/*
		case "X": / * kill grabbed node * /
			killGrabbedNode();
			; break;
		case "Z": / * kill grabbed node * /
			$("#mycanvas").toggle();
			; break;
			*/
		default: ;
			switch(keyCode) { // Reset
			    case 16:
					cl("Shift .....");
					glob.shift = true;
				break;
			    case 17:
					cl("Control .....");
					glob.control = true;
				break;
			    case 18:
					cl("Alt .....");
					glob.alt = true;
				break;
				case "Escape":
				case 27: 
					terminateModes();
					resetFun("Key Esc"); 
					break;
				case "Up":
				case 38: // up
					if(!glob._3DV) {
						prevModel();
					}
				break;
				case "Down":
				case 40: // down
					if(!glob._3DV) {
						nextModel();
					}		
				break;
				case 37: // left
					if(!glob._3DV) {
						prevPD();
					}
				break;
				case 39: // right
					if(!glob._3DV) {
						nextPD();
					}
				break;
				case 122: // F11
				break;
				case 163: //#
					Par.toggle("displayFPS"); 
					break;
				default:
					//$("#keyhelpWindow").toggle(); 
					break;				
			}
	}
}

function doKeyUp(e) {
	ml(typeof(e));
	var key;
	var keyCode;
	if (typeof(e) === "string") {
		ml("string: '"+e+"'");
		key = e;
		keyCode=e;
	} else {
		//alert(e.keyCode);
		//console.log("key"+String.fromCharCode(e.keyCode)+ "  keycode: "+e.keyCode);
		var key = String.fromCharCode(e.keyCode);
		var keyCode = e.keyCode;
	}
	switch (key) {
		default: ;
			// var options = $('#probDist option');
			// var values = $.map(options ,function(option) {
					// return option.value;
			// });
			switch(keyCode) { // Reset
			    case 16:
					cl("Shift released .....");
					glob.shift = false;
				break;
			    case 17:
					cl("Control released .....");
					glob.control = false;
				break;
			    case 18:
					cl("Alt released .....");
					glob.alt = false;
					if (glob.modelChanged){
						glob.modelChanged = false;
						startFun("doKeyUp");
					}
				break;
			}
	}
}

//
//
//
function evalMove() {
	var thresh_move = 0.06;
	var button_rad = 0.09;
	var arr = glob.touchpos;
	var s=arr[0]; //start position
	var e=arr[arr.length-1]; // end position
	var d = new Vector(e.x,e.y).subtract(s);
	//d.subtract(s); // end - start
	var mean = new Vector(s.x,s.y).add(e).multiplyBy(0.5);
	//mean.add(e);
	//mean.multiplyBy(0.5);
	var st;
	//
	// check for moves
	//
	if ((Math.abs(d.x)-Math.abs(d.y)) > thresh_move) {
		// horizontal move detected (dx > thresh .....)
		st=stripe(mean.y);
		if (d.x<0) {
			// left
			var left = true;
			//cl("LEFT MOVE, Stripe "+st+ "  meany="+mean.y);
			switch(st) {
				case 0:
					if (glob.nonstat) {
						Par.set("nonstat",false);
					}				
					prevModel();
				break;
				case 1:
					if (glob.nonstat) {
						Par.set("nonstat",false);
					}				
					prevPD();
				break;
				case 2: prevSpeed(true);
				break;
			}
		} else {
			// right
			//cl("RIGHT MOVE, Stripe "+st+ "  meany="+mean.y);
			switch(st) {
				case 0: 
					if (glob.nonstat) {
						Par.set("nonstat",false);
					}
					nextModel();
				break;
				case 1: 
					if (glob.nonstat) {
						Par.set("nonstat",false);
					}
					nextPD();
				break;
				case 2: nextSpeed(true);
				break;
			}
		}
		// replace touchpos array by its last element
		glob.touchpos = [glob.touchpos[glob.touchpos.length-1]];
	}
	// vertical and click stuff only after touchend
	if (!glob.touchUsed ) {
		//
		// check for upswipes
		// 
		if  ((Math.abs(d.y)-Math.abs(d.x)) > thresh_move) {
			glob.touchUsed = true;
			// vertical move detected
			st=stripe(mean.x);
			if (d.y < 0) {
				var up = true;
				//cl("UP MOVE, Stripe "+stripe(mean.x));//+ "  meanx="+mean.x);
				switch(st) {
					case 0: 
						flashN(1,nn.model+" reset"); 
						terminateModes();
						resetFun("evalMove");
					break;
					case 1: if(glob.running) {
								flashN(1,nn.model+" stopped"); 
								terminateModes();
								stopFun();
							} else {
								flashN(1,nn.model+" started"); startFun();
							}
					break;
					case 2: 
						flashN(1,nn.model + " re-started");
						terminateModes();
						restartFun();
					break;
				}
			} else {
				var down = true;
				//cl("DOWN MOVE, Stripe "+stripe(mean.x));//+ "  meanx="+mean.x);
			}
			// reduce touchpos to last element .........
			glob.touchpos = [glob.touchpos[glob.touchpos.length-1]];
		} else if (glob.clickActive && !glob.touchMoved && !glob.realTouchContact && (d.x < thresh_move && d.y < thresh_move)) {
			//
			// C L I C K S (no x and no y movement)
			//
			// possible click, but only in certain regions
			glob.touchUsed = true;
			var found = false;
			for (var m in magic) {
				var dissi = mean.dist(magic[m].v);
				if (dissi<button_rad) {
					magic[m].f();
					found = true;
				}	
			}
			if (!found) { 
			    // click at neutral position: show help
				glob.showTouchHelp = !glob.showTouchHelp;
				redraw();
			}
		}
	}
}

function wheelFun(e) {
	e.preventDefault(); // stop wheel event to bubble up!
	//var e = window.event || e;
	e.stopPropagation ? e.stopPropagation() : (e.cancelBubble=true);	
	
	//console.log("wheeli:"+e.originalEvent.detail);
	//console.dir(e);
	if (glob.nonstat) {
		Par.set("nonstat",false);
	}
	if (!glob.control) {
		if (e.originalEvent.detail  > 0) {
			if (glob.alt) {
				stopFun();
				nextModel();
				glob.modelChanged = true;
			} else {
				nextPD();
			}		
		} else if (e.originalEvent.detail  < 0){
			if(glob.alt) {
				stopFun();
				prevModel();
				glob.modelChanged = true;
			} else {
				prevPD();
			}
		} else {
			var xx = e.timeStamp - glob.wheelStamp;
			cl( "timestamp"+e.timeStamp + " x = " + xx);
			if (e.originalEvent.deltaY) {
				var dd = e.originalEvent.deltaY
			} else if (e.originalEvent.wheelDelta) {
				dd = -e.originalEvent.wheelDelta
			} else {
				cl("no deltaY or wheelDelta");
				dd=0;
			}
			if ((xx<10000)&&(xx>200)){
				if (dd  > 0) {
					if (glob.alt) {
						stopFun();
						nextModel();
						glob.modelChanged = true;
					} else {
						nextPD();
					}		
				} else if (dd  < 0){
					if(glob.alt) {
						stopFun();
						prevModel();
						glob.modelChanged = true;
					} else {
						prevPD();
					}
				}
			}
			glob.wheelStamp=e.timeStamp;
		}
	}
}
