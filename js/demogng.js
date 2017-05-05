//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// main stuff
//


/*global reset,animationLoop, Vector,$,signalsPresented,VBNN, speedTest*/
/*jslint node: true */
/*jslint browser:true */
/*jslint plusplus: true */

"use strict";

// For new model:
// - entry in VBNN.models
// - case in function resetFun()
//
//
var signal = new Vector(0, 0);// once, global
var can2D = document.querySelector('#mycanvas');
var div3D = document.querySelector('#div3d');
var ctx = can2D.getContext('2d');
var discrete_set;
var loop = loopGNG;
var mousePos = new Vector();

can2D.addEventListener('keydown', doKeyDown, true);
can2D.addEventListener('keyup', doKeyUp, true);
div3D.addEventListener('keydown', doKeyDown, true);
div3D.addEventListener('keyup', doKeyUp, true);


function show3D() {
    $(".MM3").show();
    $(".MM4").css("visibility","visible");
    if (ui) {
        $(".ButtonVoronoi").button().button("disable");
        $("#showSettings3D").button().button("enable");
        $(".3DButton").hide();
        $(".2DButton").show();
    }
    //$("#div3Hs").show();
    handleResize2(); // for div3H
    $("#div3d").show().css("display", "inline-block");
    $("#mycanvas").hide();
    Par.set("_3DPD",true);
    //Par.set("showSignals",true); // not needed anymore with solid bocks
    VBNN.prototype.draw = VBNN.prototype.draw3D;
    cl("show3D(): 3D visible!");
    M3D.showSignalsFun();
    render();
    redraw();
}

function hide3D() {
    $(".MM3").hide();
    $(".MM4").css("visibility", "hidden");
    if (ui) {
        $(".ButtonVoronoi").button().button("enable");
        $("#showSettings3D").button().button("disable");
        $(".3DButton").show();
        $(".2DButton").hide();
    }
    $("#settings3DWindow").hide();
    handleResize2(); // for div3H
    $("#div3d").hide();
    $("#mycanvas").show();
    Par.set("_3DPD", false); // signal distribution
    VBNN.prototype.draw = VBNN.prototype.draw2D;
    cl("3D not visible!");
    flashHide(3);
    redraw();
}

function adaptHelp() {
    if (glob._3DV) {
        $(".H3D").css("display", "table-row");
        $(".H2D").css("display", "none");
    } else {
        $(".H3D").css("display", "none");
        $(".H2D").css("display", "table-row");
    }
}

function toggle3D() {
    Par.toggle("_3DV");
    adaptHelp();
    $("#div3d").blur();
    $("#mycanvas").blur();
}

//$("#apptitle").click(function() {Par.toggle("_3DV");});
$("#div3Hs").click(function () {$("#div3H").show(); $("#div3Hs").hide(); });

var pingedNode = undefined;
var shouldStopDemo = false;

// Timeouts
var countDownTimeout = "";
var myTimeout = "";
var flashTimeout = "";
var flashMTimeout = "";
var flashFTimeout = "";
var clickTimeout = "";
var grabTimeout = "";
var speedTimeout = "";
var distTimeout = "";
var modelTimeout = "";


$("#mycanvas").mousemove(mousemovehandler);
$("#mycanvas").mousedown(mousedownhandler);
$("#mycanvas").mouseup(mouseuphandler);

//$('body').on('contextmenu', 'img', function(e){ return false; });
//$('body').on('contextmenu', '#mycanvas', function(e){ return false; }); // todo reactivate
if (ui) {
    $("button" ).button();
    $("#radio" ).buttonset();
    $(".startButton").button( "option", "label", '<i class="fa fa-play"></i> start');
    $(".startButton").click(startFun);
    $(".demoButton").click(runDemo);
    $(".3DButton").click(toggle3D);
    $(".2DButton").click(toggle3D);
    $(".restartButton").button( "option", "label", '<i class="fa fa-refresh"></i> restart');
}

var MSL = "Model"; // Model
var DSL = "Distr."; // Dist
var SSL = "Speed"; //Speed
var NB = "&nbsp;";
if (ui) {
    // next PD
    $(".npd").click(nextPD).button( "option", "label", DSL+NB+'<i class="fa fa-step-forward"></i>');
    // prev PD
    $(".ppd").click(prevPD).button( "option", "label", '<i class="fa fa-step-backward"></i>'+NB+DSL);
    // prev model
    $(".pmodel").click(prevModel).button( "option", "label", '<i class="fa fa-step-backward"></i>'+NB+MSL);
    // next model
    $(".nmodel").click(nextModel).button( "option", "label", MSL+NB+'<i class="fa fa-step-forward"></i>');
    // prev speed
    $(".pspeed").click(prevSpeed).button( "option", "label", '<i class="fa fa-step-backward"></i>'+NB+SSL);
    // next speed
    $(".nspeed").click(nextSpeed).button( "option", "label", SSL+NB+'<i class="fa fa-step-forward"></i>');
    // reset
    $(".resetButton").button( "option", "label", '<i class="fa fa-stop"></i> reset');

    //
    // define click events for non-image buttons
    //
    $(".resetButton").click(terminateModes).click(redraw).click(resetFun);
    $(".restartButton").click(terminateDemo).click(terminateAutoRestart).click(redraw).click(restartFun);
    $("#hideControls").click(function() {setViewMode("embedded")});
    $("#showControls").click(function() {setViewMode("desktop")});
}
//
// define click events for image buttons
//
var imis = ["showNodes","showEdges","showSignals", "showTrace","showVoronoi","showRotate",
            "showPDs","showAutoRestart","showSingleStep"];
for (var i in imis) {
    var x = imis[i];
    var basename = x.substring(4);
    if (glob[x]) {
        $(x).css('background-image',"url(images/"+basename+".png)")
    } else {
        $(x).css('background-image',"url(images/"+basename+"_gs.png)")
    }
    // create click function for this button
    document.getElementById(imis[i]).onclick = (function() {
        var ft = imis[i];
        return function() {
            // access properties using this keyword
            var fullname = ft; // e.g. showPDs
            // showPDs ==> PDs
            var basename = fullname.substring(4);
            // set correct image
            if ( this.checked ) {
                $(".show"+basename).css('background-image',"url(images/"+basename+".png)")
            } else {
                $(".show"+basename).css('background-image',"url(images/"+basename+"_gs.png)")
            }
            //cl("setting glob."+fullname+" to "+this.checked);
            glob[fullname]=this.checked;
            Par.set(fullname,this.checked);
            if (nn && nn.isLBGX) {
                if (fullname==="showVoronoi") {
                    Par.set("lbg_alwaysVoronoi",this.checked);
                }
            }
            if (glob._3DV && nn) {nn.update3DBuffer();};
            redraw();
        }
    })();
};
$("#showAutoRestart").click(redraw).click(alterImage).click(handleAutoRestart);
$("#showSingleStep").click(alterImage).click(handleSingleStepClick).click(redraw);
// show settings window
$("#showSettings").click(function() {
    $("#settingsWindow").toggle();
    raiseSettings();
});
$("#showSettings3D").click(function() {
    $("#settings3DWindow").toggle();
    raiseSettings3D();
});

// show help window
$("#showHelp").click(function() {
    $("#keyhelpWindow").toggle();
    raiseKeyHelp();
});

function xscale(x){
    return x*can2D.width;
}
// reverse xscale
function xscaleR(x){
    return x*1.0/can2D.width;
}

function yscale(y){
    return y*can2D.height;
}
// reverse yscale
function yscaleR(y){
    return y*1.0/can2D.height;
}

function runDemo () {
    if (ui) {
        $(".demoButton").button( "option", "label", '<i class="fa fa-stop"></i> demo');
        $("#showAutoRestart").button("disable");
        $("#showSingleStep").button("disable");
    }
    // finish auto restart (only need of active)
    terminateAutoRestart();
    shouldStopDemo = false;
    $(".demoButton").unbind('click').click(haltDemo); // bind button to haltDemo
    demoFun();
}

//
// Button SingleStep was clicked
//
function handleSingleStepClick() {
    if($("#showSingleStep").prop('checked')) {
        // begin of singlestep
        if (ui) {
            $("#showAutoRestart").button("disable");cl("--------------- disa autores");
            $(".demoButton").button("disable");
            $(".startButton").button("disable");
        }
        glob.singleStepMode = true;
        Par.set("gng_showError",0);
        Par.set("gng_showUtility",0);
        startFun();
    } else {
        // ending singlestep
        if (ui) {
            $("#showAutoRestart").button("enable");
            $(".demoButton").button("enable");
            $(".startButton").button("enable");
        }
        glob.singleStepMode = false;
        terminateModes();
        //stopFun();
        //redraw();
    }
}
//
// Button AutoRestart was clicked
//
function countDown(msecs) {
    glob.countDownVal = msecs/1000.0;
    //msecs/1000.0);
    msecs -= 1000;
    clearTimeout(countDownTimeout);
    if (msecs>=0) {
        countDownTimeout = setTimeout(function() { countDown(msecs)}, 1000);
    } else {
        glob.countDownVal = 0;
        redraw();
    }
}

function handleAutoRestart(event) {
    if (glob.demoRunning) {
        haltDemo();
        resetFun("handleAutoRestart");
        glob.running = false;
    }
    if ($("#showAutoRestart").prop('checked')) {
        if (ui) {
            $("#showSingleStep").button("disable");cl("--------------- showsistep disable");
            $(".demoButton").button("disable");
        }
        glob.autoRestartMode = true;
        if (glob.running) {
            cl("glob.running");
            // install timeout
            if (!nn.isLBGX) {
                countDown(glob.autoRestartTime*1000);
                clearTimeout(myTimeout);
                myTimeout = setTimeout(function() { stopAndMaybeRestart()}, glob.autoRestartTime*1000); //forceStop	in start_inr
            }
        } else {
            cl("not glob.running");
            if (nn) {
                startFun();
            } else {
                cl("no VBNN yet, no autorestart ....");
            }
        }
    } else {
        if (ui) {
            $("#showSingleStep").button("enable");
            $(".demoButton").button("enable");
        }
        glob.autoRestartMode = false;
        // clear timeout if present
        clearTimeout(myTimeout);
        stopFun();
        redraw();
    }
}

//
// change image according to button state
//
function alterImage(event) {
    //cl ("alterImage event.id = " + event.target.id);
    var fullname = event.target.id; // e.g. showPDs
    // showPDs ==> PDs
    var basename = fullname.substring(4);
    if ($("#"+fullname).prop('checked')) {
        $(".show"+basename).css('background-image',"url(images/"+basename+".png)")
    } else {
        $(".show"+basename).css('background-image',"url(images/"+basename+"_gs.png)")
    }
}

// show help window
function raiseKeyHelp() {
    //cl("rkh");
    $( "#settings3DWindow" ).zIndex(10);
    $( "#keyhelpWindow" ).zIndex(15);
    $( "#settingsWindow" ).zIndex(12);
}

// show settings window
function raiseSettings() {
    //cl("rse");
    $( "#settings3DWindow" ).zIndex(10);
    $( "#keyhelpWindow" ).zIndex(12);
    $( "#settingsWindow" ).zIndex(15);
}
function raiseSettings3D() {
    //cl("rse");
    $( "#keyhelpWindow" ).zIndex(10);
    $( "#settingsWindow" ).zIndex(12);
    $( "#settings3DWindow" ).zIndex(15);
}


$('#mycanvas').css('cursor', 'default');
if (ui) {
    $( "#keyhelpWindow" ).draggable().hide().click(raiseKeyHelp); // make draggable and hide for now
    $( "#settingsWindow" ).draggable().hide().click(raiseSettings); // make draggable and hide for now
    $( "#settings3DWindow" ).draggable().hide().click(raiseSettings3D); // make draggable and hide for now
} else {
    $( "#keyhelpWindow" ).hide().click(raiseKeyHelp); // make draggable and hide for now
    $( "#settingsWindow" ).hide().click(raiseSettings); // make draggable and hide for now
}

$("#mycanvas").attr("contentEditable", "true")
$("#mycanvas")[0].contentEditable = true;
var curmodel = "";
var curpd ="Circle";
var prev_curpd = "";

$(window).resize(function() {
    handleResize();
    redraw();
});

// check if we are on a mobile platform
var mobileReason = "none";
var isMobile = {
    minwidth:600,
    minheight:500,
    isSmall: function() {
        var small = false;
        if ($(window).width()<this.minwidth) {
            small = true;
            cl("isSmall: width "+ $(window).width() + " < " + this.minwidth);
            mobileReason = "width"+$(window).width();
        } else if ($(window).height()<this.minheight) {
            small = true;
            cl("isSmall: height "+ $(window).height() + " < " + this.minheight);
            mobileReason = "height"+$(window).height();
        }
        return small;
    },
    Android: function() {
        var ret = navigator.userAgent.match(/Android/i);
        if (ret) {
            mobileReason = "Android";
        }
        return ret;
    },
    BlackBerry: function() {
        var ret =  navigator.userAgent.match(/BlackBerry/i);
        if (ret) {
            mobileReason = "BlackBerry";
        }
        return ret;
    },
    iOS: function() {
        var ret =  navigator.userAgent.match(/iPhone|iPad|iPod/i);
        if (ret) {
            mobileReason = "iPhone|iPad|iPod";
        }
        return ret;
    },
    Opera: function() {
        var ret =  navigator.userAgent.match(/Opera Mini/i);
        if (ret) {
            mobileReason = "Opera Mini";
        }
        return ret;
    },
    Windows: function() {
        var ret =  navigator.userAgent.match(/IEMobile/i);
        if (ret) {
            mobileReason = "IEMobile";
        }
        return ret;
    },
    any: function() {
        var ret = isMobile.isSmall() ||isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows();
        if(ret) {
            cl("*********************************** Mobile due to "+mobileReason);
        }
        return ret===null?false:true;
    }
};

function handleResize(keepViewMode) {
    keepViewMode = keepViewMode || false;
    //cl("handleResize: mode = "+glob.viewMode);
    //
    // no viewmode given, set based on screensize
    //
    if (!keepViewMode) {
        if (glob.viewMode != "embedded") {
            // desktop .....
            if (isMobile.any()) {
                setViewMode("embedded");
            } else {
                setViewMode("desktop");
            }
        }
        //cl("handleResize: now mode = "+glob.viewMode);
    }
    handleResize2();
}

function handleResize2() {
    // size of root div
    var elem = document.getElementById('root');
    var rect = elem.getBoundingClientRect();
    var h = rect.height; // of root div
    var w = rect.width;  // of root div

    //cl("root: w:"+w+" h:"+h);
    //var maxH = window.innerHeight;
    // smaller of height and width
    var can2D = document.querySelector('canvas');
    var rest = window.innerWidth-w; // todo
    //cl("rest = "+rest); //todo uncomment
    //cl ("window.height = " + $(window).height());

    // width
    if (glob.viewmode === "embedded") {
        var canmax_w = window.innerWidth;
        $("#root").hide();
    } else {
        var canmax_w = window.innerWidth - w-0;
    }

    // height
    var canmax_h = window.innerHeight;
    var mmw = Math.min(canmax_w,rest)-1; // needed to keep in line // todo cange to 1
    if (glob._3DV) {
        var mmh = window.innerHeight;
    } else {
        var mmh = Math.min(window.innerHeight,rest); // square
    }

    // square shape for 2D
    can2D.height = mmh;
    can2D.width = mmh;
    // full size for 3D
    if (glob3D.renderer) {
        glob3D.renderer.setSize(mmw,mmh);
        glob3D.camera.aspect = mmw / mmh;
        glob3D.camera.updateProjectionMatrix();
    }
}

function redraw() {
    if (nn) {
        nn.draw(/*sigStore, noOfRecentSignals*/);
    }
}

function globalInit() {
    sigStore = [];
    var i;
    // generate some signals for display
    for (i=0;i<maxSignalsDrawn;i++) {
        sigStore.push(new Vector()); // globalInit()
    }
    handleResize();
}
function restartFun() {
    //var from="[["+(restartFun.caller?restartFun.caller.name:"none")+"]]";
    //cl(">> restartFun: called from: " + from);
    resetFun();
    startFun(); // restart
}

//
// set "loop" function to 
// set "adapt" method to the function for the new model
//
function resetFun(from) {
    //var from="[["+resetFun.caller.name+"]]";
    //cl("@resetFun: called from: " + from);
    stopFun();
    //setSignalsPresented(0, true);
    signalsPresented = 0;
    glob.signalsPresentedPrev=0;
    signalAtLastTrace = 0;
    old_signo=0;
    old_timestamp = 0;
    var netsize;
    // show buttons depending on model
    if (ui) {
        if (VBNN.models[curmodel].hasEdges) {
            $("#showEdges").button("enable");
        } else {
            $("#showEdges").button("disable");
        }
        if(!$("#showAutoRestart").prop('checked')) {
            $("#showSingleStep").button("enable");
        }
        $("#showAutoRestart").button("enable");
    }
    switch (curmodel) {
        case "GNG":
        case "GNG-U":
            $("#showEdges").show();
            loop = loopGNG;
            VBNN.prototype.adapt = VBNN.prototype.adaptGNG;
            netsize = 2;
            Par.set("gng_doUtility",curmodel === "GNG-U");
            Par.set("freezeStructure",false);
            break;
        case "NG":
        case "NG-CHL":
            loop = loopNG;
            VBNN.prototype.adapt = VBNN.prototype.adaptNG;
            netsize = glob.ng_n;
            LogPar.pars.ng_do_chl.set(curmodel === "NG-CHL");
            break;
        case "SOM":
            loop = loopSOM;
            VBNN.prototype.adapt = VBNN.prototype.adaptSOM;
            netsize = glob.som_n_1*glob.som_n_2;
            break;
        case "GG":
            loop = loopGG;
            VBNN.prototype.adapt = VBNN.prototype.adaptGG;
            netsize = glob.gg_n_1*glob.gg_n_2;
            break;
        case "HCL":
            loop = loopHCL;
            VBNN.prototype.adapt = VBNN.prototype.adaptHCL;
            netsize = glob.hcl_n;
            break;
        case "CHL":
            loop = loopCHL;
            VBNN.prototype.adapt = VBNN.prototype.adaptCHL;
            netsize = glob.chl_n;
            break;
        case "LBG":
        case "LBG-U":
            init_discrete_set("reset");
            loop = loopLBG;
            VBNN.prototype.adapt = VBNN.prototype.adaptLBG;
            netsize = glob.lbg_n;
            LogPar.pars.lbg_doUtility.set(curmodel === "LBG-U");
            break;
        default:
            loop = function(){;};
            VBNN.prototype.adapt = VBNN.prototype.adaptGNG;
                    }
    //console.log("reset! Model = " + curmodel + "   netsize = " + netsize);
    // create the model object
    noOfRecentSignals = 0;
    resetRotation();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    //
    // remove 3D objets
    //
    if(nn) {
        for (var e in nn.edges) {
            nn.edges[e].vanish();
        }
        for (var i = 0;i<glob3D.cubes.length;i++) {
            glob3D.scene.remove(glob3D.cubes[i]);
        }
    }
    glob3D.cubes=[];
    nn = new VBNN(curmodel, netsize);
    M3D.reset();
    M3D.signalsNeedsUpdate();

    nn.castPD(); // resetFun
    nn.update3DBuffer();
    nn.draw();
}

//
// create a discrete dat set from the PD
//
var prev3D=-1;
function init_discrete_set(caller) {
    // initialize discrete data set
    //cl("init_discrete_set, Caller:"+caller)
    //cl("prev_curpd: "+ prev_curpd);
    //cl("glob.prev_discrete_num:"+glob.prev_discrete_num);
    if (glob.discrete_num != glob.prev_discrete_num ||
        curpd != prev_curpd || prev3D != glob._3DV) {
        prev3D = glob._3DV;
        prev_curpd = curpd;
        glob.prev_discrete_num = glob.discrete_num;
        discrete_set = [];
        M3D.clearSignals();
        for (var i = 0; i < glob.discrete_num;i++){
            var x = new Vector();
            getSignalFromPD(x);
            x.sigbmu = ""; // Variable needed to determine LBG convergence
            discrete_set.push(x);
            //M3D.setSignal(x);
        }
        cl("sigi = "+sigi);
        M3D.signalsNeedsUpdate();
    } else {
        //cl("init_discrete_set(): same same");
    }
}

function stopFun() {
    //cl("StopFun, doing my thing ....");
    // set play icon
    if (ui) {
        $(".startButton").button( "option", "label", '<i class="fa fa-play"></i> start');
        $(".startButton").button("enable");
        // bind to startFun()
        $(".startButton").unbind().click(startFun);
    }
    glob.shouldStop = true;
}

function stopAndMaybeRestart() {
    stopFun();
    if (getCheckBoxState("showAutoRestart")) {
        // auto-restart
        if(ui) {
            $("#showSingleStep").button("disable");
        }
        clearTimeout(myTimeout);
        // shortly wait, then change PD and restart
        if(nn.model==="LBG-U") {
            var wait = 3000;
        } else {
            wait = 3000;
        }
        myTimeout = setTimeout(function() { nextPD();restartFun()}, wait);
    } else if (glob.singleStepMode) {
        // single-step
        $("#showSingleStep").trigger("click");
    } else {
        // nil
        glob.mostRecentBMU = "";
        redraw();
    }
}

function haltDemo () {
    if (ui) {
        $(".demoButton").button( "option", "label", '<i class="fa fa-smile-o fa-1x"></i> demo');
    }
    shouldStopDemo = true;
    glob.demoRunning = false;
    redraw();
    $(".demoButton").unbind('click').click(runDemo);// bind button to runDemo
    stopFun();
    if (ui) {
        $("#showAutoRestart").button("enable");
        $("#showSingleStep").button("enable");
    }
}

function terminateDemo() {
    if (glob.demoRunning) {
        haltDemo();
        glob.running = false;
    }
}

function terminateAutoRestart() {
    // finish auto restart (only need of active)
    if($("#showAutoRestart").prop('checked')) {
        $("#showAutoRestart").trigger("click");
    }
}

function terminateSingleStep() {
    // finish auto restart (only need of active)
    if($("#showSingleStep").prop('checked')) {
        $("#showSingleStep").trigger("click");
    }
}

function terminateModes() {
    terminateDemo();
    terminateAutoRestart();
    terminateSingleStep();
    clearTimeout(stepTimeout);

}

function startFun(from) {
    //var from = from || "(unspecified)";
    //from="[["+startFun.caller.name+"]]";
    //cl("## startFun(): called from: " + from);
    if (glob.showStats) {
        flashN(2,"",40,0.01,0.1);
    }

    if (nn && nn.converged) {
        // a converged model can not be continued, thus a restart
        cl("startFun(): converged ==> restart "+curmodel);
        restartFun();
        //resetFun();
    }
    nn.draw();
    if (ui) {
        // set pause icon
        $(".startButton").button( "option", "label", '<i class="fa fa-pause"></i> stop');
        // bind to stopFun()
        $(".startButton").unbind().click(terminateModes).click(redraw).click(stopFun);
    }
    glob.shouldStop = false;
    glob.running = true;
    if (glob.alwaysTimeOut || getCheckBoxState("showAutoRestart")) {
        countDown(glob.autoRestartTime*1000);
        clearTimeout(myTimeout); // delete any active timeout
        // set new timeout after 4 secs ....
        myTimeout = setTimeout(function() { stopAndMaybeRestart()}, glob.autoRestartTime*1000); //forceStop in startFun()
    }
    cl("enter animationLoop() ...");
    animationLoop();
}

function repaint() {
    nn.draw();
}

//
// select signal and adapt
//
function snapshot() {
    var i;
    for (i in nn.nodes) {
        nn.nodes[i].bio();
    }
    for (i in nn.edges) {
        nn.edges[i].bio();
    }
}

$("#mycanvas").bind('mousewheel  DOMMouseScroll', wheelFun );

//$(window).contextmenu(function() {console.log("context"); });


function killGrabbedNode() {
    if (glob.grabbedNode) {
        var i;
        for (i in glob.grabbedNode.neighbors){
            glob.grabbedNode.neighbors[i].restore();
        }
        cl("Kill! "+glob.grabbedNode.id);
        nn.removeNode(glob.grabbedNode);
        glob.grabbedNode=undefined;
        glob.isgrabbing = false;
        //showNoOfEdges();
        //showNoOfNodes(); // killGrabbed
        repaint();
    }
}


function speedTest() {
    var i = 10;
    for (i = 100; i > 0; i--) {
        nn.clear();
        nn.rmove();
        nn.draw();
        cl(i);
    }
}

//
// create some action: change net size or PD
//
// if model is finite: wait for end
// else: stop after n secs
//
var demoSeq = [
    {
        model: "NG",
        distribution: "UnitSquare",
        showVoronoi: false,
        speed: 5,
        duration: 8,
    },
    {
        model: "NG-CHL",
        distribution: "Circle",
        showVoronoi: false,
        speed: 5,
        duration: 8,
    },
    {
        call: "stopFun",
        initFromPD: false,
        speed: 6,
        duration: 0,
    },
    {
        model: "GNG",
        //distribution: "Circle",
        showVoronoi: true,
        duration: 6,
    },
    {
        distribution: "Corners",
        duration: 6,
    },
    {
        model: "GNG-U",
        duration: 6,
        initFromPD: true,
    },
    {
        model: "HCL",
        distribution: "Line",
        showVoronoi: true,
        speed: 8,
        duration: 6,
    },
    {
        model: "GG",
        distribution: "Clusters",
        showVoronoi: false,
        duration: 6,
    },
    {
        call: "stopFun",
        duration: 0,
    },
    {
        distribution: "123-D",
        duration: 1,
    },
    {
        call: "resetFun",
        gg_n_1_max: 2,
        speed: 3,
        duration: 1,
    },
    {
        call: "startFun",
    },
    {
        distribution: "UnitSquare",
        gg_n_1_max: 100,
    },
    {
        model: "SOM",
        distribution: "Circle",
        som_displayFields: true,
        showVoronoi: false,
        speed: 6,
        duration: 6,
    },
    {
        model: "GNG",
        distribution: "Cloud",
    },
    {
        model: "LBG",
        distribution: "2Squares",
    },
    {
        model: "LBG-U",
        //distribution: "Cloud",
    },
    {
        model: "GNG-U",
        distribution: "2Squares",
        speed: 3,
    },
    {
        call: "nextPD",
    },
    {
        call: "nextPD",
    },
    {
        call: "nextPD",
    },
    {
        call: "nextPD",
    },
    {
        call: "nextPD",
    },
    {
        call: "nextPD",
        speed: 8,
    },
]

function demoFun(n) {
    glob.demoRunning = true;
    var n = n || 0;
    if (shouldStopDemo) {
        glob.demoRunning = false;
        redraw();
        return;
    }
    cl("demo n = "+n);
    cd (demoSeq[n]);
    var t = 3000; // standard time
    for (var key in demoSeq[n]) {
        if (key==="model") continue; // ignore model here
        var val = demoSeq[n][key];
        if (key === "duration") {
            t = val*1000; // custom time
        } else if (key === "call") {
            window[val]();
        } else {
            Par.set(key,val);
        }
    }
    // set model as last paramter to keep flash message up
    if ("model" in demoSeq[n]){
        Par.set("model",demoSeq[n]["model"]);
    }
    clearTimeout(myTimeout);
    myTimeout = setTimeout(function() { demoFun((n+1)%demoSeq.length)}, t); // demo
}

// my logging
function ml(txt) {
    $( "#log" ).html( "<div>" + txt + "</div><br>" );
}

/*
*append* - add as last child
*prepend* - add as first child

new *appendTo* old
new *prependTo* old

new *insertBefore* old
old *before* new
old *after* new
*/


function timeStamp() {
    // Create a date object with the current time
    var now = new Date();

    // Create an array with the current month, day and time
    var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];

    // Create an array with the current hour, minute and second
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

    // Determine AM or PM suffix based on the hour
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }

    // Return the formatted string
    return date.join("/") + " " + time.join(":") + " " + suffix;
}

function getRandomIndex(n) { // from 0 to n-1
    return Math.floor(Math.random() * n);
} 
//
// convert pd to a list of fields
// from condensed description
//
function computeFieldList(name) {
    var a = [];
    var p = pds[name]
    var f = 1.0/p.n; //scaling to unit square
    for (var i in p.fields) { // y
        // "*" is interpreted a s full lline
        if (p.fields[i][0]==="*"){
            for (j=0;j<p.n;j++){
                a.push([j*f,i*f]);
            }
        } else {
            // every number is interpreted as on block among [0 .. p.n]
            for (var j in p.fields[i]) { // x
                //cl("field "+i+ "   " + p.fields[i][j]);
                var z = getRandomInt(0, p.n-1);
                a.push([p.fields[i][j]*f,i*f,z*f]);
                //a.push([p.fields[i][j]*f,i*f]);
            }
        }
    }
    // list of xy fileds
    p.xy = a;
}

function computeOutline(name) {
    var p = pds[name];
    var a = p.rawdata;
    function B(x,y){
        return a[y].charAt(x)==='#';
    }
    function W(x,y){
        return a[y].charAt(x)==='.';
    }
    p.n = a.length;
    var n = p.n;
    var f = 1.0/p.n; //scaling to unit square
    for (var i = 0;i< p.n;i++) {
        if (a[i].lastIndexOf("#")>0){
            var xstart=a[i].lastIndexOf("#");
            var ystart=i;
            break;
        }
    }
    //cl("xs: "+xstart+ " ys: "+ystart);
    var x = xstart;
    var y = ystart;
    var curDir = "";
    var x0=x; // start of current segment
    var y0=y; // start of current segment
    var O = [];
    O.push({x:x*f+f,y:y*f+f});
    do {
        //cl(B(x,y));
        var dx=0;
        var dy=0;
        if (B(x,y) && (x===n-1 || W(x+1,y))) {
            var D = "^"; //north
            dy=-1;
        } else if (W(x,y) && (y===n-1 || B(x,y+1))) {
            D = "<"; // west
            dx=-1;
        } else if ((y<n-1 && x<n-1)&&(W(x,y+1) && B(x+1,y+1))) {
            D = "V"; // south
            dy=1;
        } else if ((x<n-1)&&(B(x+1,y) && (y===n-1 || W(x+1,y+1)))) {
            D = ">"; // east
            dx=1;
        }
        //cl("D="+D+"   curDir="+curDir);
        if (curDir === "" || curDir === D) {
            // first run or continuationof same direction
            x+=dx;
            y+=dy;
            //var x1 = x;
            //var y1 = y;
            curDir=D;
        } else {
            // direction changed
            //cl(curDir + "segment from "+x0+","+y0+"  to   "+x+","+y);
            O.push({x:x*f+f,y:y*f+f});
            x0=x;
            y0=y;
            x+=dx;
            y+=dy;
            curDir=D;
        }
        //cl(D + " x="+x+" y="+y);
    } while (x != xstart || y != ystart);
    //cl(curDir + "segment from "+x0+","+y0+"  to   "+x+","+y);
    O.push({x:x*f+f,y:y*f+f});
    p.outline = O;
    //cl("done");
}
/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//
// compute from full x/y array
//
function computeFieldList2(name) {
    var a = [];
    var p = pds[name];
    p.n = p.rawdata.length;
    var f = 1.0/p.n; //scaling to unit square
    for (var i = 0;i< p.n;i++) {
        var L = p.rawdata[i]; // current line
        for (var j=0; j<L.length;j++){
            if (L.charAt(j)==='#') {
                var z = getRandomInt(0, p.n-1);
                a.push([j*f,i*f,z*f]);
            }
        }
    }
    // list of xy fileds
    p.xy = a;
    //cd(a);
}
function resetO() {
    glob.oChange = 0;
}


//
// for the three stripes for swipes
//
function stripe(x) {
    if (x < 0.33) {
        return 0;
    } else if (x > 0.66) {
        return 2;
    } else {
        return 1;
    }
}
//
// evaluate touch action to detect moves, swipes and clicks
//

/*
---------------------------
| 0                      2 |
|                          |
|                          |
|                          |
|                          |
|                          |
|                          |
|                          |
|                          |
| 3                      1 |
---------------------------
*/
function nextTouchHelp() {
    glob.touchHelpPage = (glob.touchHelpPage+1)%3;
    redraw();
}

// hidden buttons for canvas steering
var magic = {
    "viewmode": {
        n: 0,
        v: new Vector(0.1,0.1),
        f: toggleViewMode,
    },
    "demo": {
        n: 1,
        v: new Vector(0.9,0.9),
        f: function() { 	if (shouldStopDemo) {
            runDemo();
        } else {
            haltDemo();
        }
                      },

    },
    "signals": {
        n: 2,
        v: new Vector(0.1,0.7),
        f: function() {$("#showSignals").trigger("click")},
    },
    "Voronoi": {
        n:3,
        v: new Vector(0.1,0.9),
        f: function() {$("#showVoronoi").trigger("click")},
    },
    "(next page)": {
        n:3,
        v: new Vector(0.5,0.9),
        f: function() {nextTouchHelp()},
    },
    "nodes": {
        n:4,
        v: new Vector(0.1,0.3),
        f: function() {$("#showNodes").trigger("click")},
    },
    "edges": {
        n:5,
        v: new Vector(0.1,0.5),
        f: function() {$("#showEdges").trigger("click")},
    },
    "autorestart": {
        n:6,
        v: new Vector(0.5,0.1),
        f: function() {$("#showAutoRestart").trigger("click")},
    },
    "(dismiss)": {
        n:7,
        v: new Vector(0.9,0.5),
        f: function() {
            glob.showTouchHelp = !glob.showTouchHelp;
            redraw();
        },
    },
    "single-step": {
        n:8,
        v: new Vector(0.9,0.1),
        f: function() {$("#showSingleStep").trigger("click")},
    },
    "stats": {
        n:9,
        v: new Vector(0.9,0.3),
        f: function() {$("#showStats").trigger("click")},
    },
    "rotate": {
        n:9,
        v: new Vector(0.9,0.7),
        f: function() {$("#showRotate").trigger("click")},
    },
}

function toggleViewMode() {
    switch (getViewMode()) {
        case "desktop":
            setViewMode("embedded");
            break;
        case "embedded":
            setViewMode("desktop");
            break;
                         }
}

//
//
//
var timeouts = [];
function flashN(n,txt,msecs,x,y) {
    msecs = typeof msecs === 'undefined' ? 1000 : msecs;
    x = typeof x === 'undefined' ? 0 : x;
    y = typeof y === 'undefined' ? 0 : y;
    if (glob.showCanvasMessages) {
        clearTimeout(timeouts[n]);
        if(glob._3DV) {
            var pp = $("#div3d").position();
            var he = $("#div3d").height();
        } else {
            var pp = $("#mycanvas").position();
            var he = $("#mycanvas").height();
        }

        var fs = Math.round(Math.max(div3D.height/25,17)); // fontsize
        var divname = "#flashdiv"+n;
        var div = $(divname);
        div.css("top",pp.top+y*he+0);
        div.css("left",pp.left+x*he);
        div.css("font-size",fs+"px");
        div.html(txt);
        div.show();
        timeouts[n] = setTimeout(function() { div.hide();}, msecs);
    }
}
function flashHide(n) {
    if (glob.showCanvasMessages) {
        clearTimeout(timeouts[n]);
        var divname = "#flashdiv"+n;
        var div = $(divname);
        div.hide();
    }
}
function flashsmall(n,txt,msecs,x,y) {
    msecs = typeof msecs === 'undefined' ? 1000 : msecs;
    x = typeof x === 'undefined' ? 0 : x;
    y = typeof y === 'undefined' ? 0 : y;
    if (glob.showCanvasMessages) {
        clearTimeout(timeouts[n]);
        if(glob._3DV) {
            var pp = $("#div3d").position();
            var he = $("#div3d").height();
        } else {
            var pp = $("#mycanvas").position();
            var he = $("#mycanvas").height();
        }

        var fs = Math.round(Math.max(he/40,15)); // fontsize
        var divname = "#flashdiv"+n;
        var div = $(divname);
        //div.css("top",pp.top+y*he+0);
        div.css("bottom","5px");
        div.css("left",pp.left+x*he);
        div.css("font-size",/*fs+*/"15px");
        div.css("font-family","monospace");
        div.css("height",fs+"px");

        div.html("<pre class='inline'>"+txt+"</pre>");
        //div.html(txt);
        div.show();
        if (msecs > 0) {
            // autohide
            timeouts[n] = setTimeout(function() { div.hide();}, msecs);
        }
    }
}

// screen off set of canvas
function getCanvasCoords() {
    var offset = $("#mycanvas").offset();
    var posY = offset.top - $(window).scrollTop();
    var posX = offset.left - $(window).scrollLeft(); 
    return {x: posX, y:posY};
}

/*
window.addEventListener("orientationchange", function() {
	// Announce the new orientation number
	//alert(screen.orientation);
	glob.oChange+=1;
	if (glob.oChange >=2) {
		if (glob.viewMode ==="embedded") {
			setViewMode("mob ile");
		glob.oChange=0;
		}
	} else {
		setTimeout(resetO, 3000);
	}
}, false);
*/
