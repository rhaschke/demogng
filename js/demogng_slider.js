//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// Parameter definition for all models
//
/*global $, glob3D, glob, cl, nn, resetFun, curmodel, VBNN, LogPar, NumPar, M3D, pds, curpd, cb, stamp_x, stamp_y, stamp_z, show3D, hide3D, adaptHelp, Vector, SelPar, MAX_NODES, PicPar*/
/*jslint vars: true, devel: true, nomen: true, indent: 4, maxerr: 100, plusplus: true */

"use strict";

//new NumPar( { model: "TOP", name: "t_max", min: 0, max: 100000, step: 10, value: 40000 });

// GNG
var resetPerhaps = function () {
    if (curmodel !== "GNG") {
        resetFun(curmodel);
    }
};

function resetIfNG() {
    if (curmodel === "NG" || curmodel === "NG-CHL") {
        resetFun(curmodel);
    }
}

function resetIfGNG() {
    if (curmodel === "GNG" || curmodel === "GNG-U") {
        resetFun(curmodel);
    }
}

function resetIfITM() {
    if (curmodel === "ITM") {
        resetFun(curmodel);
    }
}

function resetIfCHL() {
    if (curmodel === "CHL") {
        resetFun(curmodel);
    }
}

function resetIfHCL() {
    if (curmodel === "HCL") {
        resetFun(curmodel);
    }
}

function resetIfLBG() {
    if (VBNN.nameIsLBGX(curmodel)) {
        resetFun(curmodel);
    }
}

cl("****************** gensliders() 0 LogPar *********************");
var xx;
xx = new LogPar({
    model: "HIDDEN",
    name: "noads",
    value: false,
    rem: "no google ads"
});
xx = new LogPar({
    model: "HIDDEN",
    name: "nonstat",
    value: false,
    rem: "only nonstationary PDs with autoRestart"
});
xx = new LogPar({
    model: "HIDDEN",
    name: "matchingPDs",
    value: true,
    rem: "nonstationary PDs only for constant-param models: GNG, GG, HCL"
});
xx = new LogPar({
    model: "OPT",
    name: "uniColorNodes",
    value: true,
    rem: "use a single colors for all nodes (a.o.t. individual random colors)"
});
xx = new LogPar({
    model: "OPT",
    name: "uniColorBackground",
    value: true,
    rem: "use a single color for background (a.o.t. color gradient)"
});
xx = new LogPar({
    model: "OPT",
    name: "initFromPD",
    value: true,
    rem: "init nodes from probability distribution (a.o.t. unit square)"
});
xx = new LogPar({
    model: "OPT",
    name: "stopAfterInsert",
    value: false,
    rem: "after insertion of node(s) stop (for inspection, analysis)"
});
xx = new LogPar({
    model: "OPT",
    name: "correlatedSamples",
    value: false,
    rem:"use correlated stimuli"
});
xx = new LogPar({
    model: "OPT",
    name: "restartAfterModelChange",
    value: true,
    rem: "automatically restart the simulation if a new model has been selected"
});
xx = new LogPar({
    model: "OPT",
    name: "restartAfterPDChange",
    value: false,
    rem: "automatically restart the simulation if a new distribution has been selected"
});
xx = new LogPar({
    model: "OPT",
    name: "startAfterPDChange",
    value: true,
    rem: "automatically start the simulation if a new distribution has been selected"
});
//new LogPar( { model: "OPT", name: "autoRestart", value: false, rem:"automatically restart after convergence or timeout"});
xx = new LogPar({
    model: "OPT",
    name: "alwaysTimeOut",
    value: false,
    rem: "do timeout even outside demo mode"
});
xx = new NumPar({
    model: "OPT",
    name: "autoRestartTime",
    min: 0,
    max: 10,
    step: 0.5,
    value: 5,
    rem: "for AutoRestart Mode: timeout after that many seconds"
});
xx = new NumPar({
    model: "OPT",
    name: "autoTimeOut",
    min: 0,
    max: 10,
    step: 0.1,
    value: 4,
    rem: "for Demo Mode: timeout after that many seconds"
});
xx = new NumPar({
    model: "OPT",
    name: "traceLength",
    min: 0,
    max: 20,
    step: 1,
    value: 10,
    rem: "length of displayed movement trace"
});
xx = new LogPar({
    model: "OPT",
    name: "showCanvasMessages",
    value: true,
    rem: "show messages e.g. if model or pd is changed"
});
xx = new LogPar({
    model: "HIDDEN",
    name: "doPing",
    value: false,
    rem: "show nearest unit on mouse down"
});
xx = new LogPar({
    model: "OPT",
    name: "allowGrab",
    value: true,
    rem: "allow grab and move of units with the mouse"
});
xx = new LogPar({
    model: "HIDDEN",
    name: "markBMU",
    value: false,
    rem: "highlight most recent best-matching unit"
});
xx = new LogPar({
    model: "HIDDEN",
    name: "markInserted",
    value: true,
    rem: "highlight most recently inserted unit"
});
xx = new LogPar({
    model: "OPT",
    name: "rotateDistribution",
    value: false,
    rem: "slowly rotate probability distribution"
});
xx = new LogPar({
    model: "SOM",
    name: "som_displayFields",
    value: false,
    rem: "fill fields of network structure  (only in 2D mode)"
});
xx = new LogPar({
    model: "GG",
    name: "gg_displayFields",
    value: false,
    rem: "fill fields of network structure (only in 2D mode)"
});
xx = new LogPar({
    model: "HIDDEN",
    name: "displayFPS",
    value: false,
    rem: "display frames per second"
});
xx = new LogPar({
    model: "OPT",
    name: "_3DV",
    value: true,
    rem: "3D currently visible",
    fun: "_3DVfun"
});

xx = new LogPar({
    model: "OPT",
    name: "_3DPD",
    value: true,
    rem: "3D PDs",
    fun: "_3DPDfun"
});
xx = new LogPar({
    model: "OPT",
    name: "_3DStats",
    value: false,
    rem: "3D Stats" /*, fun:"_3DPDfun"*/
});

xx = new LogPar({
    model: "OPT3D",
    name: "showUnitCube",
    value: true,
    rem: "show Unit Cube for orientation",
    fun: M3D.showUnitCubeFun
});
xx = new LogPar({
    model: "OPT3D",
    name: "PDSolidBody",
    value: true,
    rem: "show probability distributions also as solid bodys",
    fun: "pddirty"
});
xx = new LogPar({
    model: "OPT3D",
    name: "PDWireFrame",
    value: true,
    rem: "show probability distributions as wire frames",
    fun: "pddirty"
});
//new LogPar( { model: "OPT3D", name: "showDistributionSolidBodies", value: true, rem:"show probability distributions as solid semitransparent bodies", fun:"pddirty"});
xx = new LogPar({
    model: "HIDDEN",
    name: "showDistributionProjections",
    value: false,
    rem: "show probability distributions as 2D projections",
    fun: "pddirty"
});
xx = new LogPar({
    model: "OPT3D",
    name: "showAxes",
    value: false,
    rem: "show 3D axes",
    fun: M3D.showAxesFun
});
xx = new LogPar({
    model: "OPT3D",
    name: "showPlane",
    value: false,
    rem: "show 3D block as orientation",
    fun: M3D.showPlaneFun
});
xx = new LogPar({
    model: "OPT3D",
    name: "showFrame",
    value: false,
    rem: "show frame in x/y level for orientation",
    fun: M3D.showFrameFun
});
xx = new LogPar({
    model: "OPT3D",
    name: "_3DROT_X",
    value: false,
    rem: "3D autorotate",
    fun: "rotfun"
});
xx = new LogPar({
    model: "OPT3D",
    name: "_3DROT_XM",
    value: false,
    rem: "3D autorotate",
    fun: "rotfun"
});
xx = new LogPar({
    model: "OPT3D",
    name: "_3DROT_Y",
    value: false,
    rem: "3D autorotate",
    fun: "rotfun"
});
xx = new LogPar({
    model: "OPT3D",
    name: "_3DROT_YM",
    value: false,
    rem: "3D autorotate",
    fun: "rotfun"
});
xx = new LogPar({
    model: "OPT3D",
    name: "_3DROT_Z",
    value: true,
    rem: "3D autorotate",
    fun: "rotfun"
});
xx = new LogPar({
    model: "OPT3D",
    name: "_3DROT_ZM",
    value: false,
    rem: "3D autorotate",
    fun: "rotfun"
});

function pddirty() {
    pds[curpd].ready = false;
    nn.castPD();
}

function rotfun(e, ui) {
    //cl("rotfun");
    //cd(arguments);
    //console.dir(e);
    var cb, id;
    if (e.target) {
        cb = e.target.id; // mycb__3DROT_YM
    } else {
        // we come from a toggle/set call
        cb = e.cbid;
    }
    id = cb.slice(LogPar.prefix.length); // _3DROT_YM
    if (id === "_3DROT_X" || id === "_3DROT_XM") {
        if (glob[id]) {
            // was startd, take stamp
            stamp_x = Date.now();
        }
    }
    if (id === "_3DROT_Y" || id === "_3DROT_YM") {
        if (glob[id]) {
            // was startd, take stamp
            stamp_y = Date.now();
        }
    }
    if (id === "_3DROT_Z" || id === "_3DROT_ZM") {
        if (glob[id]) {
            // was startd, take stamp
            stamp_z = Date.now();
        }
    }
}

function _3DVfun() {
    if (glob._3DV) {
        show3D();
    } else {
        hide3D();
    }
    adaptHelp(); // help window
}

function _3DPDfun() {
    if (glob._3DPD) {
        Vector.prototype.randomize = Vector.prototype.randomize3;
    } else {
        Vector.prototype.randomize = Vector.prototype.randomize2;
    }
}

//new LogPar( { model: "OPT", name: "showScreenSize", value: false, rem:"currently ignored"});


/*function setSpeedAndTDraw(e,u) {
	 //console.dir(e);
	 //console.dir(u);
	 var levels = [1,3,10,20,50,100,250,500,1000,2000, 3000];
	 //cl(";;;;;;;;;;;;;;;;; setSpeedAndTDraw to level "+u.value+" ("+levels[u.value]+")");
	 NumPar.pars["t_draw"].set(levels[u.value]);
 }
 */
cl("****************** gensliders() 0 SelPar *********************");
xx = new SelPar({
    name: "model",
    list: {} /*VBNN.models*/
});
xx = new SelPar({
    name: "distribution",
    list: {} /*VBNN.distributions*/
});
xx = new SelPar({
    name: "speed",
    list: {} /*VBNN.distributions*/
});
// OPT
cl("****************** gensliders() 0 NumPar *********************");
//xx = new NumPar( { model: "TOP", name: "speedLevel", min: 0, max: 8, step: 1, value: 8, fun: "setSpeedAndTDraw",rem: "0=very slow, 8=maximum speed"});
xx = new NumPar({
    model: "OPT",
    name: "t_draw",
    min: 0,
    max: 3000,
    step: 1,
    value: 1000,
    rem: "that many signals before redraw"
});
xx = new NumPar({
    model: "OPT",
    name: "signalDiameter",
    min: 1,
    max: 10,
    step: 1,
    value: 1,
    fun: "showSigs",
    rem: "diameter of input signal representations [pixels]"
});
xx = new NumPar({
    model: "OPT",
    name: "nodeDiameter",
    min: 1,
    max: 10,
    step: 1,
    value: 4,
    fun: "showNodes",
    rem: "diameter of node representations [pixels]"
});
//xx = new NumPar( { model: "OPT", name: "nodeDiameterGrabbed", min: 1, max: 10, step: 1, value: 4, fun: "redraw"  ,rem:"" });
xx = new NumPar({
    model: "OPT",
    name: "edgeLineWidth",
    min: 0,
    max: 10,
    step: 1,
    value: 0,
    fun: "showEdges",
    rem: "width of edges [pixels]"
});
xx = new NumPar({
    model: "OPT",
    name: "singleStepDelay",
    min: 0,
    max: 1000,
    step: 1,
    value: 300,
    rem: "miliseconds between signals"
});

// GNG
xx = new LogPar({
    model: "GNG",
    name: "freezeStructure",
    value: false,
    rem: "do not modify current network structure"
});
xx = new LogPar({
    model: "GNG",
    name: "gng_doGlobalEdgeAging",
    value: true,
    rem: "GNG: Use global edge aging every N steps"
});
xx = new LogPar({
    model: "GNG",
    name: "gng_doUtility",
    value: false,
    rem: "GNG-U: use utility to remove nodes"
});
// Thanks to Robert Haschke for contributing the implementation and
// proposing to reintroduce this (deleting orphaned nodes was present
// already in Java DemoGNG and original paper):
xx = new LogPar({
    model: "GNG",
    name: "gng_delOrphanedNodes",
    value: false,
    rem: "GNG: delete a node if his last connection is deleted"
});
xx = new LogPar({
    model: "GNG",
    name: "gng_showError",
    value: false,
    rem: "show accumulated error of each node as a red circle"
});
xx = new LogPar({
    model: "GNG",
    name: "gng_showUtility",
    value: false,
    rem: "show accumulated utility of each node as a green circle"
});
xx = new LogPar({
    model: "GNG",
    name: "gng_showLastInserted",
    value: true,
    rem: "highlight most recently inserted node"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_n_max",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(100, MAX_NODES),
    rem: "max number of nodes"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_eps_b",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.02,
    rem: "learning rate for winner (bmu)"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_eps_n",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.006,
    rem: "learning rate for direct neighbors of winner (bmu)"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_lambda",
    min: 0,
    max: 1000,
    step: 10,
    value: 500,
    rem: "insert a xx = new unit always after presentation of that many input signals (until n_max reached)"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_beta",
    min: 0,
    max: 0.01,
    step: 0.0001,
    value: 0.0005,
    sym: "$\\beta$",
    rem: "decay factor for error and utility"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_age_max",
    min: 0,
    max: 500,
    step: 1,
    value: 100,
    sym: "$age_\\mbox{max}$",
    rem: "remove edges with a higher age than this"
});
xx = new NumPar({
    model: "GNG",
    name: "gng_utilfac",
    min: 0,
    max: 100,
    step: 0.1,
    value: 20,
    rem: "GNG-U: remove least useful unit if its utility is smaller by that factor than the max error over all units"
});
xx = new NumPar({
    model: "GNG",
    name: "numfac",
    min: 0,
    max: 1000,
    step: 0.1,
    fun: "redraw",
    value: 200,
    rem: "factor to steer the size of circles indicating error and utility"
});

xx = new NumPar({
    model: "ITM",
    name: "itm_e_max",
    min: 0,
    max: 0.1,
    step: 0.001,
    fun: "redraw",
    value: 0.01,
    rem: "maximum quantization error"
});
xx = new NumPar({
    model: "ITM",
    name: "itm_n_max",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(100, MAX_NODES),
    rem: "max number of nodes"
});
xx = new NumPar({
    model: "ITM",
    name: "itm_eps",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.02,
    rem: "learning rate for winner (bmu)"
});

// NG
xx = new LogPar({
    model: "NG",
    name: "ng_do_chl",
    value: true,
    rem: "add edges while learning (CHL)"
});
xx = new NumPar({
    model: "NG",
    name: "ng_n",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(100, MAX_NODES),
    fun: "resetIfNG",
    rem: "no of NG nodes"
});
xx = new NumPar({
    model: "NG",
    name: "ng_lambda_i",
    min: 0,
    max: 50,
    step: 0.01,
    value: 10,
    rem: "initial neighborhood range"
});
xx = new NumPar({
    model: "NG",
    name: "ng_lambda_f",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.01,
    rem: "final neighborhood range"
});
xx = new NumPar({
    model: "NG",
    name: "ng_eps_i",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.5,
    rem: "initial learning rate (t=0)"
});
xx = new NumPar({
    model: "NG",
    name: "ng_eps_f",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.005,
    rem: "final learning rate (t=t_max)"
});
xx = new NumPar({
    model: "NG",
    name: "ng_t_max",
    min: 0,
    max: 100000,
    step: 10,
    value: 40000,
    rem: "total number of signals to be presented"
});
xx = new NumPar({
    model: "NG",
    name: "ng_T_i",
    min: 1,
    max: 500,
    step: 1,
    value: 20,
    rem: "NG-CHL: initial maximum edge age"
});
xx = new NumPar({
    model: "NG",
    name: "ng_T_f",
    min: 1,
    max: 500,
    step: 1,
    value: 200,
    rem: "NG-CHL: final maximum edge age"
});

// SOM
xx = new NumPar({
    model: "SOM",
    name: "som_sigma_i",
    min: 0,
    max: 10,
    step: 0.1,
    value: 3.0,
    rem: "initial neighborhood parameter"
});
xx = new NumPar({
    model: "SOM",
    name: "som_sigma_f",
    min: 0,
    max: 1,
    step: 0.001,
    value: 0.1,
    rem: "final neighborhood parameter"
});
xx = new NumPar({
    model: "SOM",
    name: "som_eps_i",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.5,
    rem: "initial learning rate"
});
xx = new NumPar({
    model: "SOM",
    name: "som_eps_f",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.005,
    rem: "final learning rate"
});
xx = new NumPar({
    model: "SOM",
    name: "som_n_1",
    min: 0,
    max: 100,
    step: 1,
    value: 10,
    rem: "number of grid columns"
});
xx = new NumPar({
    model: "SOM",
    name: "som_n_2",
    min: 0,
    max: 100,
    step: 1,
    value: 10,
    rem: "number of grid rows"
});
xx = new NumPar({
    model: "SOM",
    name: "som_t_max",
    min: 0,
    max: 100000,
    step: 10,
    value: 40000,
    rem: "total number of signals to be presented"
});

// GG
xx = new NumPar({
    model: "GG",
    name: "gg_n_max",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(100, MAX_NODES),
    rem: "max number of nodes"
});
xx = new NumPar({
    model: "GG",
    name: "gg_sigma",
    min: 0.01,
    max: 10,
    step: 0.1,
    value: 2.0,
    rem: "(constant) neighborhood range"
});
xx = new NumPar({
    model: "GG",
    name: "gg_lambda",
    min: 0,
    max: 200,
    step: 1,
    value: 50,
    rem: "insert a new row/column after lambda*network size signals"
});
xx = new NumPar({
    model: "GG",
    name: "gg_eps_i",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.03,
    rem: "(constant) learning rate"
});
//new NumPar( { model: "GG", name: "gg_eps_f", min: 0, max: 0.1, step: 0.001, value: 0.005 ,rem:"" });
//new NumPar( { model: "GG", name: "gg_t_max", min: 0, max: 100000, step: 10, value: 40000,rem:"" });
//new NumPar( { model: "GG", name: "gg_n_1", min: 2, max: 100, step: 1, value: 2 ,rem:"" });
//new NumPar( { model: "GG", name: "gg_n_2", min: 1, max: 100, step: 1, value: 2 ,rem:"" });
xx = new NumPar({
    model: "GG",
    name: "gg_n_1_max",
    min: 1,
    max: 500,
    step: 1,
    value: 100,
    rem: "upper limit for no of columns (if reached only rows are inserted)"
});
//xx = new NumPar( { model: "GG", name: "gg_max_n_2", min: 2, max: 500, step: 1, value: 100 ,rem:"" });

// HCL
//xx = new LogPar( { model: "HCL", name: "learningRateConstant", value: false,rem:"" });
xx = new NumPar({
    model: "HCL",
    name: "hcl_n",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(100, MAX_NODES),
    fun: "resetIfHCL",
    rem: "number of nodes"
});
xx = new NumPar({
    model: "HCL",
    name: "hcl_eps_i",
    min: 0,
    max: 0.1,
    step: 0.001,
    value: 0.02,
    rem: "(constant) learning rate"
});
//xx = new NumPar( { model: "HCL", name: "hcl_eps_f", min: 0, max: 0.1, step: 0.001, value: 0.005 ,rem:"" });
//xx = new NumPar( { model: "HCL", name: "hcl_t_max", min: 0, max: 100000, step: 10, value: 40000,rem:"" });

// CHL
xx = new NumPar({
    model: "CHL",
    name: "chl_n",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(30, MAX_NODES),
    fun: "resetIfCHL",
    rem: "number of nodes"
});

// LBG
xx = new LogPar({
    model: "LBG",
    name: "lbg_doUtility",
    value: false,
    rem: "LBG-U: use utility to remove the least useful node as long as error after convergence decreases"
});
xx = new LogPar({
    model: "LBG",
    name: "lbg_stopAfterEachLloydIteration",
    value: false,
    rem: "LBG: stop after each Lloyd iteration"
});
xx = new LogPar({
    model: "LBG",
    name: "lbg_alwaysVoronoi",
    value: true,
    rem: "always show Voronoi diagram for LBG and LBG-U"
});
//xx = new LogPar( { model: "OPT", name: "showTrace", value: true, fun: M3D.showTraceEdgesFun,rem:"show position trace of each unit" });
xx = new LogPar({
    model: "OPT",
    name: "showStats",
    value: true
});
xx = new LogPar({
    model: "OPT",
    name: "straightTrace",
    value: false,
    rem: "straight line trace"
});
xx = new NumPar({
    model: "LBG",
    name: "discrete_num",
    min: 1,
    max: 4000,
    step: 1,
    value: 1000,
    fun: "resetFun",
    rem: "finite number of input signals (required for LBG and LBG-U)"
});
xx = new NumPar({
    model: "LBG",
    name: "lbg_n",
    min: 1,
    max: MAX_NODES,
    step: 1,
    value: Math.min(20, MAX_NODES),
    fun: "resetIfLBG",
    rem: "number of nodes"
});

// LBG-U

xx = new PicPar({
    name: "showVoronoi",
    value: false
});
xx = new PicPar({
    name: "showNodes",
    value: true,
    fun: M3D.showNodesFun
});
xx = new PicPar({
    name: "showEdges",
    value: true,
    fun: M3D.showEdgesFun
});
xx = new PicPar({
    name: "showSignals",
    value: false,
    fun: M3D.showSignalsFun
});
xx = new PicPar({
    name: "showPDs",
    value: true,
    fun: M3D.showPDsFun
});
xx = new PicPar({
    name: "showTrace",
    value: true,
    fun: M3D.showTraceEdgesFun,
    rem: "show motion trace"
});
//xx = new PicPar({name:"straightTrace", value: false, rem:"show motion trace as one straight line"});
xx = new PicPar({
    name: "showRotate",
    value: false
});
xx = new PicPar({
    name: "showAutoRestart",
    value: false
});
xx = new PicPar({
    name: "showSingleStep",
    value: false
});




//
// now .....
//
cl("****************** gensliders() 1 *********************");
var numi;
for (numi in NumPar.pars) {
    $(NumPar.pars[numi].genslider());
}

cl("****************** doSpinners() 1 *********************");
for (numi in NumPar.pars) {
    $(NumPar.pars[numi].doSpinner());
}

//
// when document is ready
//
$(function () {
    cl("****************** POSTFUN SLIDERS *********************");
    cl("******************      HTML       *********************");
    // loop over all numeric variables and add html to right table
    var i;
    var v, x, nam;
    for (i = 0; i < NumPar.names.length; i++) {
        v = NumPar.pars[NumPar.names[i]];
        //cl("Doing numpar "+NumPar.names[i]);
        x = v.doTableRow();
        //cl(x);
        nam = "#" + v.data.model + "table";
        //cl("append to " + nam);
        $(nam).append(x);
    }
    cl("****************** POSTFUN LOGVARS *********************");
    cl("******************      HTML       *********************");
    // loop over all logic variables and add html to right table
    for (i = 0; i < LogPar.names.length; i++) {
        v = LogPar.pars[LogPar.names[i]];
        x = v.doTableRow();
        //cl(x);
        nam = "#" + v.data.model + "table";
        //cl("append to " + nam);
        $(nam).append(x);
        //v.animate();
    }



    //
    // set math symbols where needed
    //
    $("#gng_lambda" + "lab").text("$\\lambda$");
    $("#gng_eps_b" + "lab").text("$\\epsilon_b$");
    $("#gng_eps_n" + "lab").text("$\\epsilon_n$");
    $("#gng_n_max" + "lab").text("$n_\\mbox{max}$");

    $("#ng_lambda_i" + "lab").text("$\\lambda_i$");
    $("#ng_lambda_f" + "lab").text("$\\lambda_f$");
    $("#ng_eps_i" + "lab").text("$\\epsilon_i$");
    $("#ng_eps_f" + "lab").text("$\\epsilon_f$");
    $("#ng_T_i" + "lab").text("$T_i$");
    $("#ng_T_f" + "lab").text("$T_f$");
    $("#ng_t_max" + "lab").text("$t_\\mbox{max}$");

    $("#gg_lambda" + "lab").text("$\\lambda$");
    $("#gg_n_max" + "lab").text("$n_\\mbox{max}$");
    $("#gg_eps_i" + "lab").text("$\\epsilon$");
    //$("#gg_eps_f"+"lab").text("$\\epsilon_f$");
    //$("#gg_t_max"+"lab").text("$t_\\mbox{max}$");
    $("#gg_sigma" + "lab").text("$\\sigma$");
    //$("#gg_n_1"+"lab").text("$n_1$");
    //$("#gg_n_2"+"lab").text("$n_2$");
    $("#gg_n_1_max" + "lab").text("$n_1 \\; \\mbox{max}$");
    //$("#gg_max_n_2"+"lab").text("$n_2 \\; \\mbox{max}$");

    $("#lbg_n" + "lab").text("$n$");
    $("#chl_n" + "lab").text("$n$");


    $("#hcl_n" + "lab").text("$n$");
    $("#hcl_eps_i" + "lab").text("$\\epsilon$");
    //$("#hcl_eps_f"+"lab").text("$\\epsilon_f$");

    $("#som_eps_i" + "lab").text("$\\epsilon_i$");
    $("#som_eps_f" + "lab").text("$\\epsilon_f$");
    $("#som_sigma_i" + "lab").text("$\\sigma_i$");
    $("#som_sigma_f" + "lab").text("$\\sigma_f$");
    $("#t_max" + "lab").text("$t_\\mbox{max}$");
    $("#som_t_max" + "lab").text("$t_\\mbox{max}$");


    $("#hcl_t_max" + "lab").text("$t_\\mbox{max}$");
    $("#t_draw" + "lab").text("$t_\\mbox{draw}$");
    $("#ng_n" + "lab").text("$n$");
    $("#som_n_1" + "lab").text("$n_1$");
    $("#som_n_2" + "lab").text("$n_2$");

    function mboxclick(id) {
        return function () {
            cl("welly ........" + id);
            var a = '$("' + "#mycb_" + id + '").checked';
            cl(a);
            cl("checked is " + eval(a));
            cl("aint nobody ....");
            //cd(this);
        };
    }

    function boxclick() {
        cl("well ........");
        cl("aint nobody ....");
    }
    //
    // delayed in delayed?
    //
    function animalog() {
        cl("****************** animate logpars *********************");
        var i;
        for (i = 0; i < LogPar.names.length; i++) {
            var v = LogPar.pars[LogPar.names[i]];
            v.animate();
        }
    }
    animalog();
    cl("****************** DONE:   SLIDERS *********************");
});
