//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// main loop control for all models
//
"use strict";
function getCheckBoxState(cbid) {
	return document.getElementById(cbid).checked;
}

var stepTimeout = "";

//
// main simulation loop
//
function animationLoop() {
	//cl("animationLoop() .....");
	if (glob.shouldStop) {
		glob.running = false;
		if (glob._3DV) {render();} // when to stop
		return;
	}

	timestamp_prev=window.performance.now();
    signalsPresented_prev = signalsPresented;
	
	// profiling stuff
	timestamp = window.performance.now();
	var milisecondsPassed = timestamp - timestamp_prev;
	//console.log("secs:"+secondsPassed);
	//sigsPerSecond = Math.round(glob.t_draw*1000.0/milisecondsPassed);
	
	loop(); // only for 1 signal in singlestep
	// draw
	nn.draw(sigStore, noOfRecentSignals);
	if (glob._3DV) {
		if (glob.showPDs && glob.running && (!pds[curpd].stationary || (glob.showRotate && !pds[curpd].rotationSymmetric))) {
		// if pd has changed:
			nn.castPD();
		// if pd is still the same:
		// just upate coordinates
		}
		render();
		} // normal
	// RAF
	if (glob.singleStepMode) {
		if (glob.shouldStop){
			// terminate singlestepmode
			("#showSingleStep").trigger("click");
		} else {
			stopFun(); // stop, wait, restart
			clearTimeout(stepTimeout);
			stepTimeout = setTimeout(startFun,glob.singleStepDelay); // restart
		}
	}
	if (!glob.shouldStop && glob.running) {
		window.requestAnimationFrame(animationLoop);	
	} else {
		glob.running = false;
		render();
	}		
}

function getSignalFromPD(signal){
	var rho;
	var theta;
	var squareWid = pds["Square-N"].width;
	var pd = undefined;
	if (pds.hasOwnProperty(curpd)){
		pd=pds[curpd];
	} else {
		cl("not found property "+ curpd);
	}
	signal.randomize();
	switch (curpd) {
        case "SquareNonUniform":
            if (signal.x < pd.width / 2 && Math.random() > .25)
                signal.x += pd.width / 2
            break;
        case "Raster2":
		case "Clusters":
		case "Clusters2":
		case "Clusters3":
			var i = getRandomIndex(pd.xy.length);
			signal.multiplyBy(1.0/pd.n);
			signal.x+=pd.xy[i][0];
			signal.y+=pd.xy[i][1];
			signal.z+=pd.xy[i][2];
			break;
		case "Spiral":
		case "Cactus":
		case "Cloud":
			var i = getRandomIndex(pd.xy.length);
			signal.multiplyBy(1.0/pd.n);
			signal.x+=pd.xy[i][0];
			signal.y+=pd.xy[i][1];
			signal.z=signal.z*pd.n*pd.depth+pd.zoff; // get to 1 again;
			break;
		case "Square-N":
			//signal.multiplyBy(pd.width);
			signal.x *= pd.width;
			signal.y *= pd.width;;
			signal.x += pd.xoff;
			signal.y += pd.yoff;;
			break;			
		case "2Squares":	
			signal.multiplyBy(pd.width);
			if (Math.random() > 0.5) {
				signal.x += 0.5;
				signal.y += 0.5;
			}	else {
				signal.x += 0.5-pd.width;
				signal.y += 0.5-pd.width;				
			}
			break;			
		case "Corners":	
			signal.multiplyBy(pd.width);
			if (Math.random() > 0.5) {
				signal.x += 1-pd.width;
			}
			if (Math.random() > 0.5) {
				signal.y += 1-pd.width;
			}
			break;			
		case "Corners-N":	
			signal.multiplyBy(pd.width); // also z
			if (Math.random() > 0.5) {
				signal.x += 1-pd.width;
			}
			if (Math.random() > 0.5) {
				signal.y += 1-pd.width;
			}
			break;			
		case "DragMe":
			signal.y *= pd.height;
			signal.x *= pd.width;
			signal.y +=pd.yoff;
			signal.x +=pd.xoff;
			break;			
		case "2OtherSquares":		
			signal.multiplyBy(pd.width);
			if (Math.random() > 0.5) {
				signal.x += 0.5;
				signal.y += 0.5-pd.width;				
			} else {
				signal.x += 0.5-pd.width;
				signal.y += 0.5;
			}
			break;			
		case "H-Stripe":
		case "V-Stripe":
		case "Line":
			signal.y *= pd.height;
			signal.x *= pd.width;
			signal.y +=(1-pd.height)/2;
			signal.x +=(1-pd.width)/2;
			break;			
		case "H-Stripe-N":
		case "V-Stripe-N":
			signal.y *= pd.height;
			signal.x *= pd.width;
			signal.y +=pd.yoff;
			signal.x +=pd.xoff;
			break;			
		case "123-D":
			//cl("MPPP");
			var c=Math.random();
			if (c<0.5) {
				// box
				//cl("box");
				signal.x=signal.x*pd.boxl+pd.xoff_box;
				signal.y=signal.y*pd.boxw+pd.yoff_box;
				signal.z=signal.z*pd.boxh+pd.zoff_box;
			} else if (c<0.8) {
				// rect
				//cl("rect");
				signal.x=signal.x*pd.rectl+pd.xoff_rect;
				signal.y=signal.y*pd.rectw+pd.yoff_rect;
				signal.z=pd.zoff_rect;
			} else if (c<0.85) {
				// line
				//cl("line");
				signal.x=signal.x*pd.linel+pd.xoff_line;
				signal.y=pd.yoff_line;
				signal.z=pd.zoff_line;				
			} else  {
				// circle
				//cl("circle");
				theta = Math.PI*2.0*Math.random();
				signal.x = Math.cos(theta)*pd.rad+pd.xoff_circle;
				signal.y = Math.sin(theta)*pd.rad+pd.yoff_circle;	
				signal.z=pd.zoff_circle;				
			}
			//cl("Multi-Signal:");
			//cd(signal);
			break;			
		case "Circle":
            // http://stats.stackexchange.com/questions/120527/how-to-generate-random-points-uniformly-distributed-in-a-circle		
			rho = Math.sqrt(Math.random());
			//theta = Math.random()*2.0*Math.Pi; //gave error
			theta = Math.PI*2.0*Math.random();
			signal.x = rho * Math.cos(theta)*pd.radius+0.5;
			signal.y = rho * Math.sin(theta)*pd.radius+0.5;	
			break;			
		case "2-Circles":
			rho = Math.sqrt(Math.random());
			//theta = Math.random()*2.0*Math.Pi; //gave error
			theta = Math.PI*2.0*Math.random();
			signal.x = rho * Math.cos(theta)*pd.radius;
			signal.y = rho * Math.sin(theta)*pd.radius+0.5;	
			if(Math.random() > 0.5) {
				signal.x += pd.radius;
			} else {
				signal.x += 1-pd.radius;
			}
			break;			
		case "bigSmallCircle":
			rho = Math.sqrt(Math.random());
			//theta = Math.random()*2.0*Math.Pi; //gave error
			theta = Math.PI*2.0*Math.random();
			if(Math.random() > 0.5) {
				signal.x = rho * Math.cos(theta)*pd.radius1+pd.radius1;
				signal.y = rho * Math.sin(theta)*pd.radius1+0.5;	
			} else {
				signal.x = rho * Math.cos(theta)*pd.radius2+(1-pd.radius2);
				signal.y = rho * Math.sin(theta)*pd.radius2+0.5;	
			}
			break;			
		case "PulsingCircle-N":
			rho = Math.sqrt(Math.random());
			theta = Math.PI*2.0*Math.random();
			signal.x = rho * Math.cos(theta)*pd.realradius+0.5;
			signal.y = rho * Math.sin(theta)*pd.realradius+0.5;	
			break;			
		case "Circle-N":
			rho = Math.sqrt(Math.random());
			//theta = Math.random()*2.0*Math.Pi; //gave error
			theta = Math.PI*2.0*Math.random();
			signal.x = rho * Math.cos(theta)*pd.radius+pd.xoff;
			signal.y = rho * Math.sin(theta)*pd.radius+pd.yoff;	
			break;			
		case "Ring":
			theta = Math.PI*2.0*Math.random();
			signal.x = Math.cos(theta)*pd.radius+0.5;
			signal.y = Math.sin(theta)*pd.radius+0.5;	
			break;			
		case "Donut":
			rho = Math.sqrt(Math.random()*(pd.radiusOuter*pd.radiusOuter - pd.radiusInner*pd.radiusInner)+
			pd.radiusInner*pd.radiusInner);
			theta = Math.PI*2.0*Math.random();
			signal.x = rho * Math.cos(theta)+0.5;
			signal.y = rho * Math.sin(theta)+0.5;	
			break;	
        default:			
	}
	if(!glob._3DV) {
		signal.z = 0.0;
	}
	if (pd.angle != 0.0 || glob.showRotate) {
			signal.rotate(pd.angle);
	}
	M3D.setSignal(signal);
}

//
// looper function for GNG
//
function loopNG() {
	//
	// NG loop
	//
	var nSignals = loopSize();
	for (var i=0;i<nSignals;i++) {
		signalsPresented += 1;
				
		// get new signal
		getSignalFromPD(signal);
		// adapt
		nn.adapt(signal); // using adaptNG
		// remember signal in case we need to draw it
		if (i < maxSignalsDrawn) {
			sigStore[i].copyFrom(signal);
		}
	}
	if (glob.showStats) {
		if (signalsPresented >= glob.ng_t_max) {
			flashN(0,(signalsPresented/glob.ng_t_max*100).toFixed(0)+"% (t_max reached)",3000,0,0.07);
		} else {
			flashN(0,(signalsPresented/glob.ng_t_max*100).toFixed(0)+"%",1000,0,0.07);
		}
	}
	if (signalsPresented >= glob.ng_t_max){
		//nn.converged=true;
		convergence("")
		stopAndMaybeRestart();
	}
	noOfRecentSignals = Math.min(maxSignalsDrawn, i);
}

function loopSOM() {
	//
	// SOM loop
	//
	var nSignals = loopSize();
	for (var i=0;i<nSignals;i++) {
		signalsPresented += 1;
				
		// get new signal
		getSignalFromPD(signal);
		// adapt
		nn.adapt(signal); // using adaptSOM
		// remember signal in case we need to draw it
		if (i < maxSignalsDrawn) {
			sigStore[i].copyFrom(signal);
		}
	}
	//if (glob.showStats) flashN(0,(signalsPresented/glob.ng_t_max*100).toFixed(0)+"%",1000,0,0.07);
	if (glob.showStats) {
		if (signalsPresented >= glob.som_t_max) {
			flashN(0,(signalsPresented/glob.som_t_max*100).toFixed(0)+"% (t_max reached)",3000,0,0.07);
		} else {
			flashN(0,(signalsPresented/glob.som_t_max*100).toFixed(0)+"%",1000,0,0.07);
		}
	}
	if (signalsPresented >= glob.som_t_max){
		//nn.converged=true;
		convergence("")
		stopAndMaybeRestart();
	}
	noOfRecentSignals = Math.min(maxSignalsDrawn, i);
}

function loopLBG() {
	var i,cn,luu,meu;
	//console.log ("loopLBG lbg_doUtility:"+glob.lbg_doUtility+" nn.firstRun="+nn.firstRun);
	// 1) determine for each signal the closest unit
	// (here we could show the means without moving the units)
	glob.anyChangeBMU = false;
	var currError = 0.0;
	// clear statistics
	for (var i in nn.nodes) {
		nn.nodes[i].error = 0.0;
		nn.nodes[i].utility = 0.0;
	}
	// acumulate per unit: meanNo, meanVec, utility and error
	for (var i = 0; i < glob.discrete_num;i++){
		var signal = discrete_set[i];
		currError += nn.adapt(signal); // using adaptLBG
	}
	//cl("anyChange:"+glob.anyChangeBMU);
	//cl("---------------- means --------------------");
	// 2) mov	e each unit to the mean of all associated signalsPresented
	
	// actually move nodes
	for (var i in nn.nodes) {
		cn = nn.nodes[i];
		if (cn.meanNo > 0) {
			// set node to meanvec/meanNo
			cn.position.copyFrom(cn.meanVec);
			cn.position.multiplyBy(1.0/cn.meanNo);
			
			if (haveTrace && glob.showTrace) {
				// trace
				var v = new Vector(); // todo: preallocate?
				v.copyFrom(cn.position);
				cn.trace.unshift(v);
			}
		}
		cn.meanVec.nullify();
		cn.meanNo = 0;
	}
	signalsPresented += 1; // means LBG steps in this case
	nn.draw();
	if (glob.lbg_stopAfterEachLloydIteration) {
		cl ("hejo stop");
		stopFun();
	}
	if (!glob.anyChangeBMU){
		// converged
		if (nn.firstRun){
			cl("LBG error = "+currError);
			nn.LBGERR = currError;
		} else {
			//cl("LBG-U error = "+currError+"  prevError = "+nn.prevError);
		}
		//cl("NO CHANGE");
		//cl("NO CHANGE LBG error = "+currError);
		// LBG has converged
		// if lbg_doUtility
		// if preverror exist
		// store previous codebook
		// move least useful unit (luu) to max error unit (meu)
		//
		if (glob.lbg_doUtility){
			if (nn.firstRun) {
				//cl("FIRSTI");
				nn.firstRun = false;
				nn.prevError = currError;
				for (i in nn.nodes) {
					cn = nn.nodes[i];
					cn.oldPos = new Vector();
				}
			} else {
				// not firstRun
				if (currError >= nn.prevError) {
					cl("******* done! RESTORE **********");
					// restore prev codebook
					for (i in nn.nodes) {
						cn = nn.nodes[i];
						cn.position.copyFrom(cn.oldPos);
					}
					cl("LBG-U final error = "+nn.prevError);
					if (glob.showStats){
						//flashN(0,"MSE improvement over LBG: "+((1.0-nn.prevError/nn.LBGERR)*100).toFixed(2)+"%",3000,0,0.1);
					}
					//nn.converged=true;
					convergence("LBG-U converged. MSE: "+ (nn.prevError).toFixed(3) + ", "+((1.0-nn.prevError/nn.LBGERR)*100).toFixed(2)+"% lower than LBG");
					stopAndMaybeRestart();
					return;
				} else {
					nn.prevError = currError;
				}
			}
			// bogus loop just to find an arbitrary unit for start values (break in the first run)
			for (i in nn.nodes) {
				cn = nn.nodes[i];
				meu = cn;
				luu = cn;
				break;
			}
			// save current codebook
			for (i in nn.nodes) {
				cn = nn.nodes[i];
				cn.oldPos.copyFrom(cn.position);
				if (cn.error > meu.error){
					meu = cn;
				}
				if (cn.utility < luu.utility){
					luu = cn
				}
			}
			// do the LBG-U move:
			// - find unit luu with min utility
			// - find unit meu with max error
			// - move luu "close" to meu
			luu.position.copyFrom(meu.position);
			luu.position.x += 0.00001;
			nn.lastInserted=luu;
			if (haveTrace) {
				// trace
				var v = new Vector(); // todo: preallocate?
				v.copyFrom(luu.position);
				cn.trace.unshift(v);
			}

		} else {
			// no utility, final converge here
			//nn.converged=true;
			convergence("LBG converged. MSE: "+ (currError).toFixed(5) );
			cl("LBG final error = "+currError);
			stopAndMaybeRestart();
		}
	}
}
var convergenceTimeout = "";
function convergence(txt) {
	txt = typeof txt === 'undefined' ? "":txt;
	cl("convergence "+txt);
	nn.converged=true;
	//nn.justconverged = true;
	if (glob.showStats) {
		flashN(2,txt,4000,0.00,0.1);
	}
	//convergenceTimeout = setTimeout(function() { nn.justconverged=false;redraw();}, 500); 
	
	if (ui) {
		$(".startButton").button("disable");
		redraw();
	}	
}
function loopSize() {
	if (glob.singleStepMode) {
		return 1;
	} else {
		return glob.t_draw;
	}
}
function loopCHL() {
	//
	// the following loop for on-line learning (a.o.t. batch learning ala LBG)
	//
	var nSignals = loopSize();
	for (var i=0;i<nSignals;i++) {
		signalsPresented += 1;
				
		// get new signal
		getSignalFromPD(signal);
		// adapt
		nn.adapt(signal); // using adaptHCL
		// remember signal in case we need to draw it
		if (i < maxSignalsDrawn) {
			sigStore[i].copyFrom(signal);
		}
	}
	noOfRecentSignals = Math.min(maxSignalsDrawn, i);
}
function loopHCL() {
	//
	// the following loop for on-line learning (a.o.t. batch learning ala LBG)
	//
	var nSignals = loopSize();
	for (var i=0;i<nSignals;i++) {
		signalsPresented += 1;
			
		// get new signal
		getSignalFromPD(signal);

		// adapt
		nn.adapt(signal); //using adaptCHL
		
		// remember signal in case we need to draw it
		if (i < maxSignalsDrawn) {
			sigStore[i].copyFrom(signal);
		}
	}
	noOfRecentSignals = Math.min(maxSignalsDrawn, i);
}

function loopGNG() {
	//
	// the following loop for on-line learning (a.o.t. batch learning ala LBG)
	//
	var nSignals = loopSize();
	for (var i=0;i<nSignals;i++) {
		signalsPresented += 1;
		
		// possibly insert
		if (0 === signalsPresented % glob.gng_lambda) {
			if (!glob.freezeStructure && nn.noOfNodes < glob.gng_n_max) {
				nn.gnginsert();
				if (glob.stopAfterInsert) {
					repaint();
					stopFun();
					return;
				}
			} else {
				nn.lastInserted = undefined;
			}
		}
		
		// get new signal
		getSignalFromPD(signal);

		// only check for utility occasionally
		var checkUtil = 0 === signalsPresented % (glob.gng_lambda/10);
		// adapt
		if (!nn) {
			debugger;
		}
		nn.adapt(signal, checkUtil); 		
		// remember signal in case we need to draw it
		if (i < maxSignalsDrawn) {
			sigStore[i].copyFrom(signal);
		}
	}
	noOfRecentSignals = Math.min(maxSignalsDrawn, i);
}

function loopGG() {
	//
	// the following loop for on-line learning (a.o.t. batch learning ala LBG)
	//
	var rhythm = glob.gg_lambda*nn.n1*nn.n2; // insert rhythm dependent on size
	var nSignals = loopSize();
	for (var i=0;i<nSignals;i++) {
		signalsPresented += 1;
		
		// possibly insert
		if (0 === signalsPresented % rhythm) {
			if (!glob.freezeStructure && nn.noOfNodes +Math.min(nn.n1,nn.n2)< glob.gg_n_max 
			/*&& ( nn.n1 < glob.gg_n_1_max || nn.n2 < glob.gg_max_n_2 ) */) {
				
				nn.gginsert();
				if (glob.stopAfterInsert) {
					repaint();
					stopFun();
					return;
				}
				return;
			} else {
				nn.newRow=-1;
				nn.newCol=-1;
			}
		}
		// get new signal
		getSignalFromPD(signal);

		// adapt
		nn.adapt(signal); 
		
		// remember signal in case we need to draw it
		if (i < maxSignalsDrawn) {
			sigStore[i].copyFrom(signal);
		}
	}
	noOfRecentSignals = Math.min(maxSignalsDrawn, i);
}


