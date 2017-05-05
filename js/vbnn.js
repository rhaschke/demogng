//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// classes: VBNN, Edge, Node, Vector
//
/*global $, glob3D, glob, cl, nn, pds, curpd, requestAnimationFrame, THREE, Vector, can2D, ctx, isIn, Node, discrete_set,
M3D, haveTrace, getSignalFromPD, yscale, xscale, pdObject, flashN */
/*jslint vars: true, devel: true, nomen: true, indent: 4, maxerr: 100, plusplus: true, white: true */
"use strict";

function osize(x) {
    return Object.keys(x).length;
}
var offi = new Vector(0.2, 0.2, 0.2);
//
// class for vector based neural networks (VBNN)
// for performance reasons:
//   - fixed predefined arrays of nodes and edges
function VBNN(model, size) {
    cl("creating new VBNN of type " + model + " with size " + size);
    this.model = model;
    //cl("n1,n2 negative");
    this.n1 = -1; // for SOM/GG
    this.n2 = -1; // for SOM/GG
    if (model === "SOM") {
        this.n1 = glob.som_n_1;
        this.n2 = glob.som_n_2;
        //cl("SOM: n1: "+this.n1 + " n2 = " + this.n2);
    }
    if (model === "GG") {
        //this.n1 = glob.gg_n_1;
        if (glob.gg_n_1_max < 2) {
            this.n1 = 1;
        } else {
            this.n1 = 2;
        }
        this.n2 = 2;
        //cl("GG: n1: "+this.n1 + " n2 = " + this.n2);
    }
    this.init(size);
    this.delta = new Vector(0, 0); // called once
    this.lastInserted = undefined;
    this.zombie = new Vector(-1, -1);
}
VBNN.nameIsLBGX = function (s) {
    return s === "LBG" || s === "LBG-U";
};
VBNN.compatible = function (a, b) {
    var ret = (a === "LBG" && b === "LBG-U") ||
        (a === "LBG-UX" && b === "LBG") ||
        (a === "GNG" && b === "GNG-U") ||
        (a === "GNG-U" && b === "GNG");
    cl(a + " and " + b + " compatible:" + ret);
    return ret;
};
VBNN.models = {
    "GNG": {
        name: "Growing Neural Gas",
        author: "Fritzke, 1995",
        staysAdaptive: true,
        detlink: "http://demogng.de/JavaPaper/node19.html#SECTION00640000000000000000",
        implemented: true,
        hasEdges: true,
        batch: false
    },
    "GNG-U": {
        name: "Growing Neural Gas with Utility",
        author: "Fritzke, 1995",
        staysAdaptive: true,
        detlink: "http://demogng.de/papers/utility.pdf",
        implemented: true,
        basemodel: "GNG",
        hasEdges: true,
        batch: false
    },
    "NG": {
        name: "Neural Gas",
        author: "Martinetz, 1995",
        staysAdaptive: false,
        detlink: "http://demogng.de/JavaPaper/node16.html#SECTION00610000000000000000",
        implemented: true
    },
    "NG-CHL": {
        name: "Neural Gas with Competitive Hebbian Learning",
        author: "Martinetz, 1995",
        staysAdaptive: false,
        detlink: "http://demogng.de/JavaPaper/node18.html#SECTION00630000000000000000",
        implemented: true,
        basemodel: "NG",
        hasEdges: true,
        batch: false
    },
    "SOM": {
        name: "Self-Organizing Map",
        author: "Kohonen, 1982",
        staysAdaptive: false,
        detlink: "http://demogng.de/JavaPaper/node22.html#SECTION00710000000000000000",
        implemented: true,
        hasFields: true,
        hasEdges: true,
        batch: false
    },
    "GG": {
        name: "Growing Grid",
        author: "Fritzke, 1995",
        staysAdaptive: true,
        detlink: "http://demogng.de/JavaPaper/node24.html#SECTION00730000000000000000",
        implemented: true,
        hasFields: true,
        hasEdges: true,
        batch: false
    },
    "HCL": {
        name: "Hard Competitive Learning",
        author: "",
        staysAdaptive: true,
        detlink: "http://demogng.de/JavaPaper/node12.html#SECTION00530000000000000000",
        implemented: true,
        batch: false
    },
    "CHL": {
        name: "Competitive Hebbian Learning",
        author: "Martinetz, 1991",
        staysAdaptive: true,
        detlink: "http://demogng.de/JavaPaper/node17.html#SECTION00620000000000000000",
        implemented: true,
        hasEdges: true,
        batch: false
    },
    "LBG": {
        name: "LBG",
        author: "Linde, Buzo, Gray, 1980",
        staysAdaptive: false,
        detlink: "http://demogng.de/JavaPaper/node10.html#SECTION00510000000000000000",
        implemented: true,
        batch: true
    },
    "LBG-U": {
        name: "LBG-U",
        author: "Fritzke, 1994",
        staysAdaptive: false,
        detlink: "http://demogng.de/papers/utility.pdf",
        implemented: false,
        basemodel: "LBG",
        batch: true
    }
};

VBNN.prototype.som_rec = function (x, y) {
    // x/y to linear Position in array
    //return y*glob.som_n_1+x;
    return y * this.n1 + x;
    //return y*nn.n1+x;
};
VBNN.prototype.gg_rec = function (x, y) {
    // x/y to linear Position in array
    //return y*glob.gg_n_1+x;
    return y * this.n1 + x;
    //return y*nn.n1+x;
};
//
// initialize stuff (mainly need for SOM and GG)
//
VBNN.prototype.init = function (size) {
    var i,
        n;
    var x,
        y,
        v;
    //cl("VBNN.prototype.init: "+size+"this.n1:"+this.n1+"   this.n2:"+this.n2);
    this.noOfNodes = 0;
    this.noOfEdges = 0;

    var e;
    if (this.model === "GG") {
        for (e in this.edges) {
            this.edges[e].vanish();
        }
    }

    this.nodes = {};
    this.edges = {};
    this.nvec = [];
    this.converged = false; // for timelimited models and LBG this can be true
    // has non-modifiable structure	?
    this.isRigid = (this.model === "SOM");

    // batch learning required?
    this.isLBGX = isIn(this.model, ["LBG", "LBG-U"]);

    //
    // randomly init only as much as currently needed (size)
    //
    var rec;
    switch (this.model) {
        case "GG":
        case "SOM":
            var nemo = this; // for closure
            rec = function (x, y) {
                return nemo.n1 * y + x;
                //return this.n1*y+x; // this undedfined!
            };
            // create nodes
            for (y = 0; y < this.n2; y++) { // y is row index [0 .. n2-1]
                for (x = 0; x < this.n1; x++) { // x is col index [0 .. n1-1]
                    //cl("nodes "+y+" "+x);
                    n = new Node(); // init() SOM/GG
                    if (glob.initFromPD) {
                        getSignalFromPD(n.position);
                    } else {
                        n.position.randomize();
                    }
                    this.nodes[n.id] = n; // node as member of vbnn.nodes object
                    this.noOfNodes++;
                    n.x = x; // grid column
                    n.y = y; // grid row
                    // trace
                    v = new Vector();
                    v.copyFrom(n.position);
                    n.trace.unshift(v); // init

                    this.nvec.push(n); // nodes in linear order
                    // is lower left corner of square?
                    /*
                    if ((x+1<this.n1) && (y+1<this.n2)){
                    n.square = true;
                    } else {
                    n.square = false;
                    }
                     */
                }
            }
            //
            //
            //
            //
            //   30     31     32     33     34     35
            // 0,5 -- 1,5 -- 2,5 -- 3,5 -- 4,5 -- 5,5
            //  |      |      |      |      |      |
            //  |24    |25    |26    |27    |28    |29
            // 0,4 -- 1,4 -- 2,4 -- 3,4 -- 4,4 -- 5,4
            //  |      |      |      |      |      |
            //  |18    |19    |20    |21    |22    |23
            // 0,3 -- 1,3 -- 2,3 -- 3,3 -- 4,3 -- 5,3
            //  |      |      |      |      |      |
            //  |12    |13    |14    |15    |16    |17
            // 0,2 -- 1,2 -- 2,2 -- 3,2 -- 4,2 -- 5,2
            //  |      |      |      |      |      |
            //  |6     |7     |8     |9     |10    |11
            // 0,1 -- 1,1 -- 2,1 -- 3,1 -- 4,1 -- 5,1
            //  |      |      |      |      |      |
            //  |0     |1     |2     |3     |4     |5
            // 0,0 -- 1,0 -- 2,0 -- 3,0 -- 4,0 -- 5,0
            //

            //
            // - create new array
            // - copy from old to new (keeping vectors)
            // - regenerate edges
            //
            // insert ROW above row y:
            //    if row <= y : x,y --> x,y
            //    else:       : x,y --> x,y+1
            //    insert new units in row y
            //
            //    move all units from row y+1 up further by n1 units
            //    interpolate units of row y+1 from row y and row y+2
            // insert COLUMN right from column x:
            //    if col <= x  : x,y --> x,y
            //    else:        : x,y --> x+1,y
            //
            //
            // create edges
            for (y = 0; y < this.n2; y++) {
                for (x = 0; x < this.n1; x++) {
                    //cl("edges "+y+" "+x+" rec(a): "+rec(x,y));
                    // x,y+1
                    //  /\
                    //  |
                    // x,y --> x+1,y
                    if (x + 1 < this.n1) {
                        //cl("edges "+y+" "+x+" rec(a): "+rec(x,y)+ " rec(b)= "+rec(x+1,y));
                        this.addEdge(this.nvec[rec(x, y)], this.nvec[rec(x + 1, y)]);
                    }
                    if (y + 1 < this.n2) {
                        //cl("edges "+y+" "+x+" rec(a): "+rec(x,y)+ " rec(b)= "+rec(x,y+1));
                        this.addEdge(this.nvec[rec(x, y)], this.nvec[rec(x, y + 1)]);
                    }
                }
            }
            break;
        case "LBG":
        case "LBG-U":
            this.firstRun = true; // initial LBG run
            this.prevError = Number.MAX_VALUE;
            // run into default!
        default:
            for (i = 0; i < size; i++) {
                n = new Node(); // init non-SOM/GG
                if (glob.initFromPD) {
                    if (this.isLBGX) {
                        n.position.copyFrom(discrete_set[Math.floor(Math.random() * discrete_set.length)]);
                    } else {
                        getSignalFromPD(n.position);
                    }
                } else {
                    n.position.randomize();
                }
                // trace
                v = new Vector();
                v.copyFrom(n.position);
                n.trace.unshift(v); // init
                // store in nodes object
                this.nodes[n.id] = n;
                this.noOfNodes++;
            }
    }
};
VBNN.prototype.removeNode = function (n) {
    // remove edges of node
    var e;
    for (e in n.edges) { // TODO var is changed in loop!
        var e2go = n.edges[e];
        e2go.vanish(); // edge removes itself from lists of end points
        delete this.edges[e2go.id]; // remove  edge itself
        this.noOfEdges--;
    }

    // remove node
    this.zombie.copyFrom(n.position);
    delete this.nodes[n.id];
    this.noOfNodes--;
    if (this.noOfNodes < 2) {
        debugger;
    }
};
glob.signalsPresentedPrev = 0;
VBNN.prototype.drawPD = function () {
    var i,
        n,
        e,
        v;

    // PD
    var pd;
    //console.log("curpd: '"+curpd+"'")
    if (pds.hasOwnProperty(curpd)) {
        //console.log("found property "+curpd);
        pd = pds[curpd];
    } else {
        cl("not found propert " + curpd);
    }
    var showPD = glob.showPDs;
    ctx.save();
    //ctx.fillStyle = "#ffcccc";
    //ctx.strokeStyle = "#ffcccc";
    ctx.strokeStyle = glob.colors.pd_2D;
    ctx.globalAlpha = 1.0;
    var xoff,
        yoff;
    // Create gradient for background
    var grd1 = ctx.createLinearGradient(0, 0, yscale(1), yscale(1));
    grd1.addColorStop(0, "#AAAAFF" /*glob.colors.bg_grad0*/ ); //blueish
    grd1.addColorStop(1, "white" /*glob.colors.bg_grad1*/ );

    /*
    // Create gradient for distribution
    var grd2 = ctx.createLinearGradient(0, 0, yscale(1), yscale(1));
    grd2.addColorStop(0, "white");
    grd2.addColorStop(1, "#FF5555"); //redish
    */
    //var grd2 = glob.colors.pd_2D;
    ctx.fillStyle = glob.colors.pd_2D;
    if (this.isLBGX) {
        // draw discrete_set
        ctx.fillStyle = glob.colors.lbg_data;
        ctx.globalAlpha = 1.0;
        for (i = 0; i < discrete_set.length; i++) {
            ctx.beginPath();
            ctx.arc(discrete_set[i].x * can2D.width, discrete_set[i].y * can2D.height, glob.signalDiameter, 0, 2 * Math.PI);
            ctx.fill();
        }
    } else {
        this.updatePD(); //drawPD
        //
        // handle rotation: move to (0,0), rotate, move back
        //
        ctx.translate(can2D.width / 2, can2D.height / 2);
        ctx.rotate(pd.angle);
        ctx.translate(-can2D.width / 2, -can2D.height / 2);

        //glob.signalsPresentedPrev = signalsPresented;
        switch (curpd) {
            case "Square-N":
            case "UnitSquare":
                ctx.rect(xscale(pd.xoff), yscale(pd.yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                break;
            case "SquareNonUniform":
                //ctx.fillStyle = glob.colors.pd_2D;
                //ctx.fillStyle = "#fee";
                ctx.save();
                ctx.fillStyle = "#ddd";
                ctx.fillRect(xscale(pd.xoff), yscale(pd.yoff), xscale(0.5*pd.width), yscale(pd.width));
                //ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.fillStyle = "#bbb";
                ctx.fillRect(xscale(pd.xoff+0.5*pd.width), yscale(pd.yoff), xscale(0.5*pd.width), yscale(pd.width));
                ctx.restore();
                break;
            case "Fovea":
                // void ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
                ctx.save();
                ctx.fillStyle = "#ddd";
                ctx.beginPath();
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.rad_o), 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.fillStyle = "#bbb";
                ctx.beginPath();
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.rad_i), 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();
                break;
            case "DragMe":
                ctx.rect(xscale(pd.xoff), yscale(pd.yoff), xscale(pd.width), yscale(pd.height));
                ctx.fill();
                if (glob.isPDgrabbing) {
                    ctx.strokeStyle = "#000";
                    ctx.stroke();
                }
                ctx.fillStyle = "#666";
                ctx.font = (can2D.width / 20) + "px Verdana"; // scaled
                var txt = "drag me!";
                // pixel coordinates
                ctx.fillText(txt, xscale(pd.xoff), yscale(pd.yoff));
                break;
            case "Raster2":
            case "Clusters":
            case "Clusters2":
            case "Clusters3":
                var xy = pd.xy;
                for (i = 0; i < xy.length; i++) {
                    xoff = xy[i][0];
                    yoff = xy[i][1];
                    if (showPD) {
                        ctx.rect(xscale(xoff), yscale(yoff), xscale(1.0 / pd.n), yscale(1.0 / pd.n));
                        ctx.fill();
                    }
                }
                break;
            case "Cactus":
            case "Cloud":
            case "Spiral":
                ctx.save();

                ctx.strokeStyle = "#666666";
                var O = pd.outline;
                ctx.beginPath();
                ctx.moveTo(xscale(O[0].x), yscale(O[0].y));
                var no = pd.outline.length;
                for (i = 1; i < no; i++) {
                    ctx.lineTo(xscale(O[i].x), yscale(O[i].y));
                }
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;
            case "2Squares":
                xoff = 0.5 - pd.width;
                yoff = xoff;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                xoff = 0.5;
                yoff = xoff;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                break;
            case "2OtherSquares":
                xoff = 0.5 - pd.width;
                yoff = 0.5;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                xoff = 0.5;
                yoff = 0.5 - pd.width;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                break;
            case "Corners-N":
            case "Corners":
                xoff = 0.0;
                yoff = 0.0;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                xoff = 1 - pd.width;
                yoff = 0.0;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                xoff = 0.0;
                yoff = 1 - pd.width;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                xoff = 1 - pd.width;
                yoff = 1 - pd.width;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.width));
                ctx.fill();
                break;
            case "H-Stripe":
            case "V-Stripe":
            case "Line":
                xoff = (1 - pd.width) / 2;
                yoff = (1 - pd.height) / 2;
                ctx.rect(xscale(xoff), yscale(yoff), xscale(pd.width), yscale(pd.height));
                ctx.fill();
                break;
            case "V-Stripe-N":
                ctx.rect(xscale(pd.xoff), yscale(pd.yoff), xscale(pd.width), yscale(pd.height));
                ctx.fill();
                break;
            case "H-Stripe-N":
                ctx.rect(xscale(pd.xoff), yscale(pd.yoff), xscale(pd.width), yscale(pd.height));
                ctx.fill();
                break;
            case "123-D":
                ctx.rect(xscale(pd.xoff_box), yscale(pd.yoff_box), xscale(pd.boxl), yscale(pd.boxw));
                ctx.fill();
                ctx.rect(xscale(pd.xoff_rect), yscale(pd.yoff_rect), xscale(pd.rectl), yscale(pd.rectw));
                ctx.fill();
                ctx.rect(xscale(pd.xoff_line), yscale(pd.yoff_line - 0.5 * 0.002), xscale(pd.linel), yscale(0.002));
                ctx.fill();
                ctx.save();
                ctx.strokeStyle = ctx.fillStyle;
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.arc(xscale(pd.xoff_circle), yscale(pd.yoff_circle), xscale(pd.rad), 0, 2 * Math.PI);
                ctx.stroke();
                ctx.restore();
                break;
            case "Circle":
                ctx.beginPath();
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.radius), 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "2-Circles":
                ctx.beginPath();
                ctx.arc(xscale(pd.radius), yscale(0.5), xscale(pd.radius), 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(xscale(1 - pd.radius), yscale(0.5), xscale(pd.radius), 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "bigSmallCircle":
                ctx.beginPath();
                ctx.arc(xscale(pd.radius1), yscale(0.5), xscale(pd.radius1), 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(xscale(1 - pd.radius2), yscale(0.5), xscale(pd.radius2), 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "PulsingCircle-N":
                ctx.beginPath();
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.realradius), 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "Circle-N":
                var range = 1 - 2 * pd.radius;
                ctx.beginPath();
                ctx.arc(xscale(pd.xoff), yscale(pd.yoff), xscale(pd.radius), 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "Ring":
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.radius), 0, 2 * Math.PI);
                ctx.stroke();
                ctx.restore();
                break;
            case "Donut":
                // ring from 0.8 to 1, i.e. r from 0.64 to 1
                ctx.beginPath();
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.radiusOuter), 0, 2 * Math.PI);
                ctx.fill();
                if (glob.uniColorBackground) {
                    ctx.fillStyle = glob.colors.bg_2D;
                } else {
                    ctx.fillStyle = grd1; //"#FFFFFF";
                }

                ctx.beginPath();
                ctx.arc(xscale(0.5), yscale(0.5), xscale(pd.radiusInner), 0, 2 * Math.PI);
                ctx.fill();

                break;
            default:
        }
    }
    ctx.restore();
};
//
// remove pd from scene
//
VBNN.prototype.hidePD = function () {
    if (glob3D.pd_objects !== []) {
        var i;
        for (i = 0; i < glob3D.pd_objects.length; i++) {
            glob3D.scene.remove(glob3D.pd_objects[i]);
        }
        glob3D.pd_objects = []; // hide PD ()
    }
};

//
// draw the PD
//
VBNN.prototype.castPD = function () {
    //
    // if pd is called initially: create 3D objects, set pd.ready to true
    // if pd is called subsequentially: re-use object, only rotate
    // if pd is changed: set pd.ready to false

    var i,
        n,
        e,
        v;
    // PD
    var pd;
    if (pds.hasOwnProperty(curpd)) {
        pd = pds[curpd];
    } else {
        cl("pd not found property " + curpd);
    }
    // remove old pd stuff
    var pdcol = glob.colors.pd_3Dproj; //"#ffff00";
    //var pdcol = "#ff6666";//"#ffff00";
    if (!pd.ready) {
        // need to recreate pd, remove previous ones
        if (glob3D.pd_objects !== []) {
            for (i = 0; i < glob3D.pd_objects.length; i++) {
                var obi = glob3D.pd_objects[i];
                glob3D.scene.remove(obi);
                if (obi.material) {
                    obi.material.dispose();
                }
                if (obi.texture) {
                    obi.texture.dispose();
                }
                if (obi.geometry) {
                    obi.geometry.dispose();
                }
            }
            glob3D.pd_objects = []; // cast PD
        }
    }
    var xoff,
        yoff;
    if (this.isLBGX) {
        /* todo
        for (i = 0; i < discrete_set.length; i++) {
        	ctx.beginPath();
        	ctx.arc(discrete_set[i].x * can2D.width, discrete_set[i].y * can2D.height, glob.signalDiameter, 0, 2 * Math.PI);
        	ctx.fill();
        }
        */
    } else {
        this.updatePD(); // castPD
        var angle = pd.angle;
        //
        // handle rotation
        //
        var h = 0.01;
        var bodycol = glob.colors.pd_3D; //"#aaa";
        var pivot;
        if (pd.ready) {
            pivot = pd.pivot;
            pivot.rotation.z = -angle;
        } else {
            var showproj = glob.showDistributionProjections;
            var showwire = glob.PDWireFrame;
            var showbody = glob.PDSolidBody;
            pivot = new THREE.Object3D();
            pd.pivot = pivot;
            pivot.position.x = 0.5;
            pivot.position.y = 0.5;
            pivot.position.z = 0.0;
            pivot.rotation.z = -angle;
            var group = M3D.addGroup();
            switch (curpd) {
                case "Square-N":
                case "UnitSquare":
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, pd.xoff + pd.width / 2, pd.yoff + pd.width / 2, -0.05, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, 1.0, pd.xoff + pd.width / 2, pd.yoff + pd.width / 2, 0.5, bodycol, showbody, showwire));
                    break;
                case "SquareNonUniform":
                    if (showproj) {
                        group.add(M3D.addBox(pd.width/2, pd.width, h, pd.xoff + pd.width *0.75, pd.yoff + pd.width *0.5, -0.05, pdcol));
                    }
                    if (showwire || showbody) {
                        group.add(M3D.addEdgeBox(pd.width/2, pd.width, 1.0, pd.xoff + pd.width *0.75, pd.yoff + pd.width *0.5, 0.5, bodycol, showbody, showwire));
                    }
                    break;

                case "Fovea":
                    if (showproj) {
                        group.add(M3D.addCylinder(pd.rad_i, h, 0.5, 0.5, -0.04, pdcol));
                    }
                    if (showwire || showbody) {
                        group.add(M3D.addEdgeCylinder(pd.rad_i, 1.0, 0.5, 0.5, 0.5, bodycol, showbody, showwire));
                        group.add(M3D.addEdgeCylinder(pd.rad_o, 1.0, 0.5, 0.5, 0.5, bodycol, showbody, showwire));
                        //group.add(M3D.addCylinder(pd.radius*0.9,1,0.5,0.5,0.5,pdcol));

                    }
                    break;
                case "DragMe":
                    if (showproj) group.add(M3D.addBox(pd.width, pd.height, h, pd.xoff + pd.width / 2, 1 - (pd.yoff + pd.height / 2), -0.05, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.height, 1.0, pd.xoff + pd.width / 2, 1 - (pd.yoff + pd.height / 2), 0.5, bodycol, showbody, showwire));
                    break;

                case "Raster2":
                case "Clusters":
                case "Clusters2":
                case "Clusters3":
                    var xy = pd.xy;
                    var w = 1.0 / pd.n;
                    for (i = 0; i < xy.length; i++) {
                        xoff = xy[i][0];
                        yoff = xy[i][1];
                        var zoff = xy[i][2];
                        //cl("zoff " + i + "= " + zoff);
                        if (showproj) group.add(M3D.addBox(w, w, h, xoff + w / 2, 1 - (yoff + w / 2), -0.05, pdcol));
                        if (showwire || showbody) group.add(M3D.addEdgeBox(w, w, w, xoff + w / 2, 1 - (yoff + w / 2), zoff + w / 2, bodycol, showbody, showwire));
                    }
                    break;

                case "Cactus":
                case "Cloud":
                case "Spiral":
                    if (showproj) group.add(M3D.addShape(pd.outline, h, 0.0, 0.0, -0.05, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeShape(pd.outline, pd.depth, 0.0, 0.0, pd.zoff, bodycol, showbody, showwire));
                    break;

                case "2Squares":
                    xoff = 0.5 - pd.width;
                    yoff = xoff;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));

                    xoff = 0.5;
                    yoff = xoff;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));
                    break;
                case "2OtherSquares":
                    xoff = 0.5 - pd.width;
                    yoff = 0.5;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));

                    xoff = 0.5;
                    yoff = 0.5 - pd.width;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));
                    break;

                case "Corners-N":
                case "Corners":
                    xoff = 0.0;
                    yoff = 0.0;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));

                    xoff = 1 - pd.width;
                    yoff = 0.0;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));

                    xoff = 0.0;
                    yoff = 1 - pd.width;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));

                    xoff = 1 - pd.width;
                    yoff = 1 - pd.width;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.width, h, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.width, pd.width, xoff + pd.width / 2, 1 - (yoff + pd.width / 2), pd.width / 2, bodycol, showbody, showwire));
                    break;
                case "H-Stripe":
                case "V-Stripe":
                case "Line":
                    xoff = (1 - pd.width) / 2;
                    yoff = (1 - pd.height) / 2;
                    if (showproj) group.add(M3D.addBox(pd.width, pd.height, h, xoff + pd.width / 2, 1 - (yoff + pd.height / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.height, 1, xoff + pd.width / 2, 1 - (yoff + pd.height / 2), 1 / 2.0, bodycol, showbody, showwire));
                    break;
                case "V-Stripe-N":
                case "H-Stripe-N":
                    if (showproj) group.add(M3D.addBox(pd.width, pd.height, h, pd.xoff + pd.width / 2, 1 - (pd.yoff + pd.height / 2), -0.08, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.width, pd.height, 1, pd.xoff + pd.width / 2, 1 - (pd.yoff + pd.height / 2), 1 / 2.0, bodycol, showbody, showwire));
                    break;
                case "123-D":
                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.boxl, pd.boxw, pd.boxh, pd.xoff_box + pd.boxl / 2, pd.yoff_box + pd.boxw / 2, pd.zoff_box + pd.boxh / 2, bodycol, showbody, showwire));

                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.rectl, pd.rectw, 0.001, pd.xoff_rect + pd.rectl / 2, pd.yoff_rect + pd.rectw / 2, pd.zoff_rect + 0.001 / 2, bodycol, showbody, showwire));

                    if (showwire || showbody) group.add(M3D.addEdgeBox(pd.linel, 0.001, 0.001, pd.xoff_line + pd.rectl / 2, pd.yoff_line + 0.001 / 2, pd.zoff_line + 0.001 / 2, bodycol, showbody, showwire));

                    if (showwire || showbody) group.add(M3D.addEdgeCircle(pd.rad, pd.xoff_circle, pd.yoff_circle, pd.zoff_circle, bodycol, showbody, showwire));

                    break;
                case "Circle":
                    if (showproj) {
                        group.add(M3D.addCylinder(pd.radius, h, 0.5, 0.5, -0.04, pdcol));
                    }
                    if (showwire || showbody) {
                        group.add(M3D.addEdgeCylinder(pd.radius, 1.0, 0.5, 0.5, 0.5, bodycol, showbody, showwire));
                        //group.add(M3D.addCylinder(pd.radius*0.9,1,0.5,0.5,0.5,pdcol));

                    }
                    break;

                case "2-Circles":
                    if (showproj) group.add(M3D.addCylinder(pd.radius, h, pd.radius, 0.5, -0.04, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeCylinder(pd.radius, 1.0, pd.radius, 0.5, 0.5, bodycol, showbody, showwire));
                    if (showproj) group.add(M3D.addCylinder(pd.radius, h, 1 - pd.radius, 0.5, -0.04, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeCylinder(pd.radius, 1.0, 1 - pd.radius, 0.5, 0.5, bodycol, showbody, showwire));
                    break;
                case "bigSmallCircle":
                    if (showproj) group.add(M3D.addCylinder(pd.radius1, h, pd.radius1, 0.5, -0.04, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeCylinder(pd.radius1, 1.0, pd.radius1, 0.5, 0.5, bodycol, showbody, showwire));
                    if (showproj) group.add(M3D.addCylinder(pd.radius2, h, 1 - pd.radius2, 0.5, -0.04, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeCylinder(pd.radius2, 1.0, 1 - pd.radius2, 0.5, 0.5, bodycol, showbody, showwire));
                    break;
                case "PulsingCircle-N":
                    if (showproj) group.add(M3D.addCylinder(pd.realradius, h, 0.5, 0.5, -0.04, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeCylinder(pd.realradius, 1.0, 0.5, 0.5, 0.5, bodycol, showbody, showwire));
                    break;
                case "Circle-N":
                    if (showproj) group.add(M3D.addCylinder(pd.radius, h, pd.xoff, 1 - pd.yoff, -0.04, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeCylinder(pd.radius, 1.0, pd.xoff, 1 - pd.yoff, 0.5, bodycol, showbody, showwire));
                    break;
                case "Ring":
                    if (showproj) group.add(M3D.addRing(pd.radius - 0.01, pd.radius + 0.01, 0.5, 0.5, -0.05, pdcol));
                    if (showwire || showbody) group.add(M3D.addEdgeTube(pd.radius, 1.0, 0.5, 0.5, 0.0, bodycol, showbody, showwire));
                    break;
                case "Donut":
                    // ring from 0.8 to 1, i.e. r from 0.64 to 1
                    if (showproj) group.add(M3D.addRing(pd.radiusInner, pd.radiusOuter, 0.5, 0.5, -0.05, pdcol));
                    break;

                default:
            }
            pivot.add(group);
            group.position.x = -0.5;
            group.position.y = -0.5;
            glob3D.scene.add(pivot);
            glob3D.pd_objects.push(pivot);
            pdObject = pivot;
            pd.ready = pd.stationary; // non-stationary will be re-cast
        }
    }
};
//var haveTrace = false;
VBNN.prototype.recordTrace = function () {
    if (haveTrace && (signalsPresented > signalAtLastTrace)) {
        signalAtLastTrace = signalsPresented;
        var tracy = glob.traceLength;
        var n,cn,v;
        for (n in this.nodes) {
            cn = this.nodes[n];
            // set coordinates of associated object
            v = new Vector(); // todo: preallocate?
            v.copyFrom(cn.position);
            cn.trace.unshift(v);
            if (!nn.isLBGX) {
                while (cn.trace.length > tracy) {
                    cn.trace.pop();
                }
            }
        }
    }
};

var old_signo = 0;
var old_frameno = 0;
var old_timestamp = 0;
var newtime = false;
var fps = 0;
var frames = 0;
VBNN.prototype.draw = function () {
    cl("draw()");
};
var prevNodes = 0;
var prevEdges = 0;
var prevTraceEdges = 0;
var farvec = new Vector(1000, 1000, 1000);
VBNN.prototype.update3DBuffer = function () {
    var i = 0;
    var n, j, e, x, cn;
    var tracy = glob.traceLength;
    if (glob.showNodes) {
        for (n in this.nodes) {
            cn = this.nodes[n];
            // set coordinates of associated object
            M3D.setNode(i, cn.position);
            i += 1;
        }
    }
    if (prevNodes > i) {
        // remove unneeded previous nodes
        for (j = i; j < prevNodes; j++) {
            M3D.setNode(j, farvec, farvec);
        }
    }
    prevNodes = i;
    M3D.offsetsNeedsUpdate();
    this.recordTrace();
    if (glob.showSignals) {
        M3D.signalsNeedsUpdate();
    }

    i = 0;
    if (glob.showEdges) {
        //cl("do the edges ...");
        for (e in this.edges) {
            // set coordinates of associated vertices
            //var endps = Object.values(this.edges[e].nodes); // not supported in Safari
            var endps = [];
            for (x in this.edges[e].nodes) {
                endps.push(this.edges[e].nodes[x]);
            }
            // update edge in buffer
            M3D.setEdge(i, endps[0].position, endps[1].position);
            i += 1;
        }
        //cl("i= "+i);
    }
    if (prevEdges > i) {
        // remove unneeded previous edges
        for (j = i; j < prevEdges; j++) {
            M3D.setEdge(j, farvec, farvec);
        }
    }
    prevEdges = i; // remember

    var ih = 0;
    if (haveTrace && glob.showTrace) {
        // trace
        for (n in this.nodes) {
            cn = this.nodes[n];
            if (cn.trace.length > 1) {
                //cl("cn.h ist.length:"+cn.h ist.length);
                if (glob.straightTrace) {
                    M3D.setTraceEdge(ih,
                        cn.trace[0],
                        cn.trace[cn.trace.length - 1]
                    );
                    ih += 1;
                } else {
                    for (j = 0; j < cn.trace.length - 1; j++) {
                        //cl(ih);
                        //cd(cn.h ist[j]);
                        //cd(cn.h ist[j+1]);
                        M3D.setTraceEdge(ih,
                            cn.trace[j],
                            cn.trace[j + 1]
                        );
                        ih += 1;
                    }
                }
            }
        }

        if (prevTraceEdges > ih) {
            // remove unneeded previous edges
            for (j = ih; j < prevTraceEdges; j++) {
                M3D.setTraceEdge(j, farvec, farvec);
            }
        }
        prevTraceEdges = ih; // remember
    }

    M3D.offsetsNeedsUpdate();
}
//
// update any timevarying parameters of pd
//
VBNN.prototype.updatePD = function () {
    // PD
    var pd;
    if (pds.hasOwnProperty(curpd)) {
        pd = pds[curpd];
    } else {
        cl("not found property " + curpd);
    }

    this.sin1 = (Math.sin(-signalsPresented / 10000.0) + 1.0) / 2.0; //[0,1] sin slow
    //this.cos1 = (Math.cos(-signalsPresented/10000.0)+1.0)/2.0; //[0,1]
    this.sin2 = (Math.sin(-signalsPresented / 30000.0) + 1.0) / 2.0; //[0,1] sin medium
    this.cos2 = (Math.cos(-signalsPresented / 30000.0) + 1.0) / 2.0; //[0,1]
    if (glob.showRotate && (!(curpd === "Circle-N"))) {
        // update for rotation (unless the pd itself has rotation)
        pd.angle += (signalsPresented - glob.signalsPresentedPrev) / 600.0 * Math.PI / 180;
    }
    glob.signalsPresentedPrev = signalsPresented;
    switch (curpd) {
        case "Square-N":
            pd.xoff = this.sin1 * (1 - pd.width);
            break;
        case "Corners-N":
            pd.width = this.sin2 * 0.4 + 0.1;
        case "V-Stripe-N":
            pd.xoff = (1 - pd.width) * this.sin2;
            pd.yoff = (1 - pd.height) / 2;
            break;
        case "H-Stripe-N":
            pd.xoff = (1 - pd.width) / 2;
            pd.yoff = (1 - pd.height) * this.sin2;
            break;
        case "PulsingCircle-N":
            pd.realradius = pd.radius + this.sin1 * (0.5 - pd.radius);
            break;
        case "Circle-N":
            var range = 1 - 2 * pd.radius;
            pd.xoff = this.sin2 * range + pd.radius;
            pd.yoff = this.cos2 * range + pd.radius;
            break;
        default:
    }
}
VBNN.prototype.draw3D = function () {
    this.updatePD(); // draw3D
    if (glob.running) {
        this.update3DBuffer();
    }
    if (glob.showStats) {
        var naga = " model:" + this.model + "      ";
        var txt = naga.slice(0, 13);
        var tt = txt;
        txt += " t=" + mypad(signalsPresented, 7);
        txt += " nodes=" + mypad(this.noOfNodes, 4);
        txt += " edges=" + mypad(this.noOfEdges, 4)
        //txt += " sigs/s=" + sigsPerSecond + " ";
        flashsmall(3, txt, -1, 0.0, 0.95);
    } else {
        flashHide(3);
    }
};
VBNN.prototype.draw2D = function () {
    //cl("draw2D()");
    frames++;
    var sigvec = sigStore;
    var signo = noOfRecentSignals;
    var x, y, e, j, v, n;

    var d = new Date();
    var timestamp = d.getTime(); //  number of milliseconds since 1970/01/01
    if (old_timestamp > 0) {
        if (timestamp - old_timestamp > 100) {
            var newsps = (signalsPresented - old_signo) * 1.0 / (timestamp - old_timestamp) * 1000;
            var newfps = frames * 1.0 / (timestamp - old_timestamp) * 1000;
            frames = 0;
            if (sigsPerSecond > 0) {
                sigsPerSecond = Math.round(0.95 * sigsPerSecond + 0.05 * newsps);
                fps = 0.95 * fps + 0.05 * newfps;
            } else {
                sigsPerSecond = Math.round(newsps);
                fps = newfps;
            }
            old_timestamp = timestamp;
            old_signo = signalsPresented;
            newtime = true;
        } else {
            newtime = false;
        }
    } else {
        sigsPerSecond = 0;
        newtime = false;
        old_timestamp = timestamp;
        fps = 0;
    }
    if (glob.displayFPS)
        flashN(2, "fps= " + fps.toFixed(1), 700, 0.0, 0.14);
    this.clear(); // TODO
    // draw PD
    this.updatePD(); // drawPD2
    if (glob.showPDs) {
        this.drawPD();
    }

    ctx.save();
    // voronoi
    if (glob.showVoronoi || (nn.isLBGX && glob.lbg_alwaysVoronoi)) {
        var voronoi = new Voronoi();
        var bbox = {
            xl: 0,
            xr: 1.0,
            yt: 0,
            yb: 1.0
        }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
        var sites = []; //[ {x: 200, y: 200}, {x: 50, y: 250}, {x: 400, y: 100} /* , ... */ ];
        for (n in this.nodes) {
            sites.push(this.nodes[n].position)
        }

        // a 'vertex' is an object exhibiting 'x' and 'y' properties. The
        // Voronoi object will add a unique 'voronoiId' property to all
        // sites. The 'voronoiId' can be used as a key to lookup the associated cell
        // in diagram.cells.

        var diagram = voronoi.compute(sites, bbox);
        //cl("voronoi.noOfEdges:"+diagram.edges.length+" voronoi.vertices:"+diagram.vertices.length);
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 0;
        ctx.strokeStyle = glob.colors.voronoi;
        for (i = diagram.edges.length - 1; i >= 0; i--) {
            e = diagram.edges[i];

            var p1 = e.va;
            var p2 = e.vb;
            ctx.beginPath();
            ctx.moveTo(xscale(p1.x), yscale(p1.y));
            ctx.lineTo(xscale(p2.x), yscale(p2.y));
            ctx.stroke(); // Draw it

        }
    }
    ctx.restore();

    // signals
    ctx.strokeStyle = "black";
    if (glob.showSignals && !this.isLBGX) {
        // signals
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 1.0;
        for (i = signo - 1; i >= 0; i--) {
            ctx.beginPath();
            ctx.arc(sigvec[i].x * can2D.width, sigvec[i].y * can2D.height, glob.signalDiameter, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    // edges
    ctx.save()
    ctx.globalAlpha = 1.0;
    if (glob.freezeStructure && !nn.isRigid) {
        ctx.strokeStyle = glob.colors.freeze;
    } else {
        ctx.strokeStyle = glob.colors.edge;
    }
    ctx.lineWidth = glob.edgeLineWidth;

    if ((nn.model === "SOM" && glob.som_displayFields) || (nn.model === "GG" && glob.gg_displayFields)) {
        // field display ......
        var nemo = this;
        var rec = function (x, y) {
            return nemo.n1 * y + x;
        }
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = glob.colors.field; //"#FFFF00";
        var edgy = glob.showEdges;
        for (y = 0; y < this.n2 - 1; y++) {
            for (x = 0; x < this.n1 - 1; x++) {
                // fuekd faces as closed polygons
                ctx.beginPath();
                n = this.nvec[rec(x, y)];
                var v = n.position;
                ctx.moveTo(xscale(v.x), yscale(v.y));
                n = this.nvec[rec(x + 1, y)];
                v = n.position;
                ctx.lineTo(xscale(v.x), yscale(v.y));
                n = this.nvec[rec(x + 1, y + 1)];
                v = n.position;
                ctx.lineTo(xscale(v.x), yscale(v.y));
                n = this.nvec[rec(x, y + 1)];
                v = n.position;
                ctx.lineTo(xscale(v.x), yscale(v.y));
                ctx.closePath();
                ctx.fill();
                if (edgy) {
                    ctx.stroke();
                }
            }
        }
    } else {
        // edges only
        //ctx.globalAlpha = 0.6;
        if (glob.showEdges) {
            for (e in this.edges) {
                this.edges[e].draw();
            }
        }
    }
    ctx.restore();
    this.recordTrace();

    // trace
    if (haveTrace && glob.showTrace) {
        ctx.save();
        ctx.strokeStyle = glob.colors.trace;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        var strait = glob.straightTrace === true;
        for (i in this.nodes) {
            n = this.nodes[i];
            ctx.beginPath();
            v = n.position;
            ctx.moveTo(xscale(v.x), yscale(v.y));
            if (strait) {
                if (n.trace.length > 1) {
                    v = n.trace[n.trace.length - 1];
                    ctx.lineTo(xscale(v.x), yscale(v.y));
                }
            } else {
                for (j = 0; j < n.trace.length; j++) {
                    v = n.trace[j];
                    ctx.lineTo(xscale(v.x), yscale(v.y));
                }
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    // nodes
    ctx.save();
    ctx.lineWidth = 0;
    ctx.strokeStyle = "#000";
    if (glob.showNodes) {
        var drawPars = (this.model === "GNG" || this.model === "GNG-U") && (glob.gng_showError || glob.gng_showUtility);
        if (drawPars && signalsPresented > 0) {
            for (n in this.nodes) {
                this.nodes[n].drawParams();
            }
        } else {
            Node.coli = glob.colors.node_2D;
            for (n in this.nodes) {
                this.nodes[n].draw();
            }
        }
    }
    ctx.restore(); // nodes

    // model name
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.font = (can2D.width / 10) + "px Verdana";
    // Create gradient for font like "demo"
    var gradient = ctx.createLinearGradient(0, 0, 100, 0);
    gradient.addColorStop("0", "magenta" /*glob.colors.txt_grad00*/ );
    gradient.addColorStop("0.5", "blue" /*glob.colors.txt_grad05*/ );
    gradient.addColorStop("1.0", "red" /*glob.colors.txt_grad10*/ );
    // Fill with gradient
    ctx.fillStyle = gradient;
    var txt = this.model;

    // demo notification
    if (glob.demoRunning) {
        ctx.font = (can2D.width / 20) + "px Verdana"; // scaled
        var txt = "demo";
        // pixel coordinates
        ctx.fillText(txt, can2D.width - ctx.measureText(txt).width - can2D.width / 200, can2D.width / 20);
    }

    if (glob.autoRestartMode) {
        ctx.font = (can2D.width / 20) + "px Verdana"; // scaled
        var txt = "auto-restart";
        if (!nn.isLBGX) {
            txt += " in " + glob.countDownVal + "s";
            if (!VBNN.models[curmodel].staysAdaptive) {
                txt += " (max.)";
            }
        }
        // pixel coordinates
        ctx.fillText(txt, can2D.width - ctx.measureText(txt).width - can2D.width / 200, can2D.width / 20);
    }

    if (glob.singleStepMode && !glob.autoRestartMode) {
        ctx.font = (can2D.width / 20) + "px Verdana"; // scaled
        var txt = "single-step";
        // pixel coordinates
        ctx.fillText(txt, can2D.width - ctx.measureText(txt).width - can2D.width / 200, can2D.width / 20);
    }

    if (glob.showStats) {
        ctx.fillStyle = "black";
        ctx.font = Math.max((can2D.width / 40), 16) + "px Courier"; // scaled
        var naga = " model:" + this.model + "      ";
        var txt = naga.slice(0, 13);
        var tt = txt;
        txt += " t=" + mypad(signalsPresented, 7);
        if (ctx.measureText(txt).width > can2D.width) {
            txt = tt;
        } else {
            tt = txt;
            txt += " nodes=" + mypad(this.noOfNodes, 4);
            if (ctx.measureText(txt).width > can2D.width) {
                txt = tt;
            } else {
                tt = txt;
                txt += " edges=" + mypad(this.noOfEdges, 4)
                if (ctx.measureText(txt).width > can2D.width) {
                    txt = tt;
                } else {
                    tt = txt;
                    txt += " sigs/s=" + sigsPerSecond + " ";
                    if (ctx.measureText(txt).width > can2D.width) {
                        txt = tt;
                    }
                }
            }
        }
        // pixel coordinates
        ctx.globalAlpha = 0.4;
        /// color for background
        ctx.fillStyle = '#fff';

        /// get width of text
        var width = ctx.measureText(txt).width;
        var height = ctx.measureText('M ').width;
        /// draw background rect assuming height of font
        //ctx.fillRect(x, y, width, parseInt(ctx.font, 10));
        ctx.fillRect(0, can2D.width * 0.99 - height * 0.8, width, height);

        ctx.globalAlpha = 0.7;
        /// text color
        ctx.fillStyle = '#000';
        ctx.fillText(txt, 0, can2D.width * 0.99);
    }
    ctx.globalAlpha = 0.6;
    if (glob.showTouchHelp) {
        switch (glob.touchHelpPage) {
            case 0:
                // draw overlay
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(0.0), xscale(1.0), yscale(1.0 / 3.0));
                ctx.fill();
                ctx.font = (can2D.width / 20) + "px Verdana"; // scaled
                ctx.fillStyle = "white";
                txt = "<-------- Model -------->";
                ctx.fillText(txt, can2D.width / 2 - ctx.measureText(txt).width / 2 - can2D.width / 200, can2D.width / 6);

                ctx.fillStyle = "#6666FF";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(1.0 / 3), xscale(1.0), yscale(1.0 / 3.0));
                ctx.fill();
                ctx.fillStyle = "white";
                txt = "<----- Distribution ----->";
                ctx.fillText(txt, can2D.width / 2 - ctx.measureText(txt).width / 2 - can2D.width / 200, can2D.width / 6 + can2D.width / 3);

                ctx.fillStyle = "olive";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(2.0 / 3), xscale(1.0), yscale(1.0 / 3.0));
                ctx.fill();
                ctx.fillStyle = "white";
                txt = "<-------- Speed -------->";
                ctx.fillText(txt, can2D.width / 2 - ctx.measureText(txt).width / 2 - can2D.width / 200, can2D.width / 6 + can2D.width / 1.5);
                //txt = "(next page)"
                //ctx.font=(can2D.width/30)+"px Verdana"; // scaled
                //ctx.fillText(txt,can2D.width/2-ctx.measureText(txt).width/2-can2D.width/200, can2D.width*0.97);
                ctx.font = (can2D.width / 30) + "px Verdana"; // scaled
                ctx.fillStyle = "red";
                p = "(next page)";
                txt = p;
                ctx.fillText(txt, xscale(magic[p].v.x) - ctx.measureText(txt).width / 2, xscale(magic[p].v.y));
                p = "(dismiss)";
                txt = p;
                ctx.fillText(txt, xscale(magic[p].v.x) - ctx.measureText(txt).width / 2, xscale(magic[p].v.y));
                break;
            case 1:
                ctx.save();
                ctx.rotate(Math.PI * 2 / (4));
                ctx.translate(0, -can2D.width);
                // draw overlay
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(0.0), xscale(1.0), yscale(1.0 / 3.0));
                ctx.fill();
                ctx.font = (can2D.width / 20) + "px Verdana"; // scaled
                ctx.fillStyle = "white";
                txt = "<--------- restart";
                ctx.fillText(txt, can2D.width / 2 - ctx.measureText(txt).width / 2 - can2D.width / 200, can2D.width / 6);

                ctx.fillStyle = "#6666FF";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(1.0 / 3), xscale(1.0), yscale(1.0 / 3.0));
                ctx.fill();
                ctx.fillStyle = "white";
                txt = "<------ start/stop";
                ctx.fillText(txt, can2D.width / 2 - ctx.measureText(txt).width / 2 - can2D.width / 200, can2D.width / 6 + can2D.width / 3);

                ctx.fillStyle = "olive";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(2.0 / 3), xscale(1.0), yscale(1.0 / 3.0));
                ctx.fill();
                ctx.fillStyle = "white";
                txt = "<---------- reset";
                ctx.fillText(txt, can2D.width / 2 - ctx.measureText(txt).width / 2 - can2D.width / 200, can2D.width / 6 + can2D.width / 1.5);
                ctx.restore();
                ctx.font = (can2D.width / 30) + "px Verdana"; // scaled
                ctx.fillStyle = "red";
                p = "(next page)";
                txt = p;
                ctx.fillText(txt, xscale(magic[p].v.x) - ctx.measureText(txt).width / 2, xscale(magic[p].v.y));
                p = "(dismiss)";
                txt = p;
                ctx.fillText(txt, xscale(magic[p].v.x) - ctx.measureText(txt).width / 2, xscale(magic[p].v.y));

                //txt = "(next page)"
                //ctx.font=(can2D.width/30)+"px Verdana"; // scaled
                //ctx.fillText(txt,can2D.width/2-ctx.measureText(txt).width/2-can2D.width/200, can2D.width*0.97);
                break;
            case 2:
                // draw overlay
                ctx.fillStyle = "#777777";
                ctx.beginPath();
                ctx.rect(xscale(0.0), yscale(0.0), xscale(1.0), yscale(1.0));
                ctx.fill();

                ctx.fillStyle = "white";
                ctx.font = (can2D.width / 30) + "px Verdana"; // scaled
                //ctx.fillText(txt,can2D.width/2-ctx.measureText(txt).width/2-can2D.width/200, can2D.width*0.97);
                for (var p in magic) {
                    txt = p;
                    if (txt === "viewmode") {
                        if (getViewMode() === "desktop") {
                            txt = "\"mobile\"";
                        } else {
                            txt = "\"desktop\"";
                        }
                    }
                    if (txt === "(next page)" || txt === "(dismiss)") {
                        ctx.fillStyle = "red";
                    } else {
                        ctx.fillStyle = "white";
                    }
                    ctx.fillText(txt, xscale(magic[p].v.x) - ctx.measureText(txt).width / 2, xscale(magic[p].v.y));
                }
                break;
        }
    }
    ctx.restore();
    ctx.globalAlpha = 1.0;
}

VBNN.prototype.draw = VBNN.prototype.draw2D;
// padding
function mypad(x, n) {
    return ("" + x + "         ").slice(0, n);
}
VBNN.prototype.clear = function () {
    //cl(timeStamp()+" CLEAR!");
    ctx.beginPath();
    if (nn.justconverged) {
        ctx.fillStyle = glob.colors.bg_2D_converged;
    } else if (glob.uniColorBackground) {
        // unicolor bg
        ctx.fillStyle = glob.colors.bg_2D;
    } else {
        // Create gradient
        var grd = ctx.createLinearGradient(0, 0, yscale(1), yscale(1));
        grd.addColorStop(0, "#AAAAFF");
        grd.addColorStop(1, "white");

        // Fill with gradient
        ctx.fillStyle = grd;
    }

    ctx.fillRect(0, 0, can2D.width, can2D.height);
    ctx.fillStyle = "#000000";
}
VBNN.prototype.removeEdges = function (edgesToRemove) {
    // remove edges if any
    for (var e = edgesToRemove.length - 1; e >= 0; e--) {
        var nodes = edgesToRemove[e].vanish(); //tell edge to go
        if (glob.gng_delOrphanedNodes)
            for (var i = nodes.length - 1; i >= 0; i--)
                if (this.noOfNodes > 3)
                    this.removeNode(nodes[i])
        delete this.edges[edgesToRemove[e].id];
        this.noOfEdges--;
    }
}

// add edge from node a to node b
VBNN.prototype.addEdge = function (a, b) {
    var e = new Edge(a, b);
    this.edges[e.id] = e;
    this.noOfEdges++;
}

// insert column after column c (so at c+1)
VBNN.prototype.gginsertCol = function (c) {
    // save nvec
    var cvec = [];
    for (var i = 0; i < this.nvec.length; i++) {
        var n = this.nvec[i];
        cvec.push(n);
        //cl("cvec ["+i+"] = x:"+n.x+ "y: " + n.y)
    }
    // increment number of columns
    this.n1++;
    //cl("VBNN.prototype.gginsertRow call init with");
    //cl(this.n1*this.n2);
    this.init(this.n1 * this.n2);
    // init with new measures
    // copy what is to copy (vector positions)
    // insert COLUMN right from column c:
    //    if y <= c  : x,y --> x,y
    //    else:        : x,y --> x+1,y

    var nemo = this;
    // x,y to linear position for current measures
    var rec = function (x, y) {
        return nemo.n1 * y + x;
    }
    // x,y to linear position for old measures
    var recO = function (x, y) {
        return (nemo.n1 - 1) * y + x;
    }
    // loop over all old vectors and assign to new
    for (var y = 0; y < this.n2; y++) {
        for (var x = 0; x < this.n1 - 1; x++) {
            if (x <= c) {
                this.nvec[rec(x, y)].position.copyFrom(cvec[recO(x, y)].position);
                this.nvec[rec(x, y)].color = cvec[recO(x, y)].color;
                this.nvec[rec(x, y)].color0 = cvec[recO(x, y)].color0;
                this.nvec[rec(x, y)].trace = [].concat(cvec[recO(x, y)].trace);
            } else {
                this.nvec[rec(x + 1, y)].position.copyFrom(cvec[recO(x, y)].position);
                this.nvec[rec(x + 1, y)].color = cvec[recO(x, y)].color;
                this.nvec[rec(x + 1, y)].color0 = cvec[recO(x, y)].color0;
                this.nvec[rec(x + 1, y)].trace = [].concat(cvec[recO(x, y)].trace);
            }
        }
    }
    // interpolate new column (c+1)
    for (var y = 0; y < this.n2; y++) {
        this.nvec[rec(c + 1, y)].position.copyFrom(this.nvec[rec(c + 2, y)].position);
        this.nvec[rec(c + 1, y)].position.add(this.nvec[rec(c, y)].position);
        this.nvec[rec(c + 1, y)].position.multiplyBy(0.5);
        this.nvec[rec(c + 1, y)].trace = [];
        //this.nvec[rec(c+1,y)].position.copyFrom(this.nvec[rec(c,y)].position);
    };
    this.newCol = c + 1;
    this.newRow = -1;
}
// insert row above row r (so at row r+1)
VBNN.prototype.gginsertRow = function (r) {
    // save nvec
    var cvec = [];
    for (var i = 0; i < this.nvec.length; i++) {
        var n = this.nvec[i];
        cvec.push(n);
        //cl("cvec ["+i+"] = x:"+n.x+ "y: " + n.y)
    }
    this.n2++;
    //cl("VBNN.prototype.gginsertRow call init with");
    //cl(this.n1*this.n2);
    this.init(this.n1 * this.n2); // complete reinit
    // init with new measures
    // copy what is to copy (vector positions)
    // insert ROW above row y:
    //    if y <= r : x,y --> x,y
    //    else:       : x,y --> x,y+1
    //    insert new units in row r+1
    //    interpolate from row r and r+2
    var nemo = this;
    // x,y to linear position for current measures
    var rec = function (x, y) {
        return nemo.n1 * y + x;
    }
    // loop over all old vectors and assign to new
    for (var y = 0; y < this.n2 - 1; y++) {
        for (var x = 0; x < this.n1; x++) {
            if (y <= r) {
                this.nvec[rec(x, y)].position.copyFrom(cvec[rec(x, y)].position);
                this.nvec[rec(x, y)].color = cvec[rec(x, y)].color;
                this.nvec[rec(x, y)].color0 = cvec[rec(x, y)].color0;
                this.nvec[rec(x, y)].trace = [].concat(cvec[rec(x, y)].trace);
            } else {
                this.nvec[rec(x, y + 1)].position.copyFrom(cvec[rec(x, y)].position);
                this.nvec[rec(x, y + 1)].color = cvec[rec(x, y)].color;
                this.nvec[rec(x, y + 1)].color0 = cvec[rec(x, y)].color0;
                this.nvec[rec(x, y + 1)].trace = [].concat(cvec[rec(x, y)].trace);
            }
        }
    }
    // interpolate new row (r+1)
    for (var x = 0; x < this.n1; x++) {
        this.nvec[rec(x, r + 1)].position.copyFrom(this.nvec[rec(x, r + 2)].position);
        this.nvec[rec(x, r + 1)].position.add(this.nvec[rec(x, r)].position);
        this.nvec[rec(x, r + 1)].position.multiplyBy(0.5);
        this.nvec[rec(x, r + 1)].trace = [];
    };
    this.newRow = r + 1;
    this.newCol = -1;
}

VBNN.prototype.gginsert = function () {
    var maxErr = 0;
    var maxI = 0;
    var badUnit = undefined;

    // find node with max error
    for (var i in this.nodes) {
        if (this.nodes[i].error >= maxErr) {
            maxErr = this.nodes[i].error;
            badUnit = this.nodes[i];
        }
    }
    // badunit is determined here

    //
    // check which neigbor is most distant,
    //
    var dmax = 0.0;
    var stranger;
    for (i in badUnit.neighbors) { // if no neighbors this is skipped
        var n = badUnit.neighbors[i];
        if ((this.n1 >= glob.gg_n_1_max || this.noOfNodes + this.n2 > glob.gg_n_max) && badUnit.y === n.y) {
            // n1 has already reached col limit or another col would surpass max number of nodes
            continue;
        }
        if (( /*this.n2 >= glob.gg_max_n_2||*/ this.noOfNodes + this.n1 > glob.gg_n_max) && badUnit.x === n.x) {
            // n2 has already reached row limit  or another row would surpass max number of nodes
            continue;
        }

        var d = n.position.sqdist(badUnit.position);
        if (d >= dmax) {
            dmax = d;
            stranger = n;
        }
    }
    // here stranger is the most distant neighbor
    var doIt = true;
    if (doIt) {
        if (badUnit.x === stranger.x) {
            // same column, so we add a new row
            this.gginsertRow(Math.min(badUnit.y, stranger.y));
        } else {
            // same row, so we add new column
            this.gginsertCol(Math.min(badUnit.x, stranger.x));
        }
    } else {
        //insert new row/col between them
        //
        if (badUnit.y < this.n2 - 1) {
            var r = badUnit.y;
        } else {
            // badUnit is in last row!
            r = badUnit.y - 1;
        }
        this.gginsertRow(r);
    }
}
VBNN.prototype.gnginsert = function () {
    //cl("insert");
    // determine node with max error
    // determine neigbor with largest error
    // split edge with new node
    // redistribute error
    var maxErr = 0;
    var maxI = 0;
    var badUnit = undefined;
    // find node with max error
    for (var i in this.nodes) {
        if (this.nodes[i].error > maxErr) {
            maxErr = this.nodes[i].error;
            badUnit = this.nodes[i];
        }
    }
    // assertion: badUnit is node with max error

    var maxErrN = 0
    var badNeighbor = undefined;
    for (i in badUnit.neighbors) {
        var ErrN = badUnit.neighbors[i].error;
        if (ErrN >= maxErrN) {
            maxErrN = ErrN;
            badNeighbor = badUnit.neighbors[i];
        }

    }
    // assert: badNeighbor is neighbor with max error (or is -1 if no neigbors exist)
    // generate new node
    var n = new Node(); // gngINsert()
    this.nodes[n.id] = n;
    this.noOfNodes++;
    var v = n.position;
    v.copyFrom(badUnit.position); // make new node equal to maxerr node
    if (badNeighbor) {
        v.add(badNeighbor.position);
        v.multiplyBy(0.5);
        // rearrange errors
        badNeighbor.error /= 2;
    }
    badUnit.error /= 2;
    n.error = badUnit.error;
    n.utility = badUnit.utility;

    //if (debug) { n.bio(" new guy in town: ");}
    this.lastInserted = n;

    // remove edge
    for (var e in badUnit.edges) {
        if (badNeighbor.id in badUnit.edges[e].nodes) {
            this.addEdge(n, badUnit);
            if (badNeighbor) {
                this.addEdge(n, badNeighbor);
            }
            this.removeEdges([badUnit.edges[e]]);
            break;
        }
    }
    //this.removeEdges([this.nodes[maxI].edges[maxErrNI]]); // TODO
    // add new edges for new unit
    //this.addEdge(n, badUnit);
    //if (badNeighbor) {
    //	this.addEdge(n, badNeighbor);
    //}
}

VBNN.prototype.findBMU = function (signal) {
    // find bmu
    var bmu, i;

    //
    // for networks with no or only local neigborhood
    //
    var curdist = 0;
    var mindist = Number.MAX_VALUE;

    var cv, cn;
    // loop over all nodes, comparing square distances
    for (i in this.nodes) {
        cn = this.nodes[i];
        cv = cn.position;
        // my own sqdist
        curdist = (cv.x - signal.x) * (cv.x - signal.x) + (cv.y - signal.y) * (cv.y - signal.y) + (cv.z - signal.z) * (cv.z - signal.z);
        if (curdist < mindist) {
            //cl("currdist: "+curdist);
            // closest gets new value
            mindist = curdist;
            bmu = cn;
        }
    }
    return bmu;
}
VBNN.prototype.findBMU2 = function (signal) {
    // find bmu and bmu2

    var curdist = 0;
    var mindist = Number.MAX_VALUE;
    var min2dist = Number.MAX_VALUE;
    var bmu = undefined,
        bmu2;
    // loop over all nodes, comparing square distances
    for (var i in this.nodes) {
        var cn = this.nodes[i];
        var cv = cn.position;
        // my own sqdist
        curdist = (cv.x - signal.x) * (cv.x - signal.x) + (cv.y - signal.y) * (cv.y - signal.y) + (cv.z - signal.z) * (cv.z - signal.z);
        if (curdist < mindist) {
            // new closest one
            // closest gets new value
            if (bmu) {
                min2dist = mindist;
                bmu2 = bmu;
            }
            mindist = curdist;
            bmu = cn;
        } else {

            if (curdist < min2dist) {
                min2dist = curdist;
                bmu2 = cn;
            }
        }
    }
    return [bmu, bmu2];
}

function logArrayElements(element, index, array) {
    cl('a[' + index + '] = ' + element.dist);
}

VBNN.prototype.adaptNG = function (signal) {
    var bmu = this.findBMU(signal);
    glob.mostRecentBMU = bmu;
    // determine distance to each unit
    // order by distance
    // adapt according to NG function(t,delta,sigma)
    var i,
        k,
        cv,
        cn;
    var units = [];
    for (i in this.nodes) {
        cn = this.nodes[i];
        cv = cn.position;
        // my own sqdist
        cn.dist = (cv.x - signal.x) * (cv.x - signal.x) + (cv.y - signal.y) * (cv.y - signal.y) + (cv.z - signal.z) * (cv.z - signal.z);
        units.push(cn);
    }
    units.sort(function (a, b) {
        return a.dist - b.dist
    });
    // adapt
    var t = signalsPresented;
    for (k = 0; k < units.length; k++) {
        var lambda = glob.ng_lambda_i * Math.pow(glob.ng_lambda_f / glob.ng_lambda_i, t / 1.0 / glob.ng_t_max);
        var epsilon = glob.ng_eps_i * Math.pow(glob.ng_eps_f / glob.ng_eps_i, t / 1.0 / glob.ng_t_max);
        var h = Math.exp(-k / lambda);
        var ada = epsilon * h;
        if (ada > 0.08) {
            //cur.somne=true;
            units[k].adaptRank = 0;
        } else if (ada > 0.02) {
            units[k].adaptRank = 1;
        } else {
            units[k].adaptRank = -1;
            //cur.somne=false;
        }
        this.delta.copyFrom(signal); // delta = \xi
        this.delta.subtract(units[k].position); // delta -= w_bmu
        this.delta.multiplyBy(ada); // delta *= eps_b
        units[k].position.add(this.delta); //adapt bmu
    }
    if (glob.ng_do_chl) {
        var bmu = units[0];
        var bmu2 = units[1];
        if (!bmu.isNeighborOf(bmu2)) {
            // add new edge between bmu and bmu3
            this.addEdge(bmu, bmu2);
        }
        // age all edges of bmu
        var glob_gng_age_max = glob.gng_age_max;
        var edgesToRemove = [];
        for (i in bmu.edges) {
            var ecur = bmu.edges[i];
            ecur.age++;
            // is bmu2 also part of this edge? if so, reset age!!!!
            if (bmu2.id in ecur.nodes) {
                ecur.age = 0; // reset
                if (debug) {
                    cl("reset age of " + ecur.id);
                };
            }
            // now check for old edges
            if (ecur.age > glob_gng_age_max) {
                // edge too old: remove!
                // check if edge is already marked for removal
                if (!ecur.moriturus) {
                    // mark for removal
                    ecur.moriturus = true;
                    // add to removal list
                    edgesToRemove.push(ecur);
                }
            }
        }
        // re-set age of edge to bmu2
        this.removeEdges(edgesToRemove);

    }
}

VBNN.prototype.adaptSOM = function (signal) {
    // determine Manhatten distance to each unit
    // adapt according to NG function(t,delta,sigma)

    var bmu = this.findBMU(signal);
    glob.mostRecentBMU = bmu;
    //
    // adapt according to SOM functions
    //
    var t = signalsPresented;
    var epsilon = glob.som_eps_i * Math.pow(glob.som_eps_f / glob.som_eps_i, t / 1.0 / glob.som_t_max);
    var sigma = glob.som_sigma_i * Math.pow(glob.som_sigma_f / glob.som_sigma_i, t / 1.0 / glob.som_t_max);
    for (var x = 0; x < glob.som_n_1; x++) {
        for (var y = 0; y < glob.som_n_2; y++) {
            var d = Math.abs(x - bmu.x) + Math.abs(y - bmu.y);
            var hrs = Math.exp(-d * d / (2 * sigma * sigma));
            var cur = this.nvec[x + glob.som_n_1 * y]; // current node
            var ada = epsilon * hrs;
            // mark neighbors with certain adaptation
            if (ada > 0.08) {
                //cur.somne=true;
                cur.adaptRank = 0;
            } else if (ada > 0.02) {
                cur.adaptRank = 1;
            } else {
                cur.adaptRank = -1;
                //cur.somne=false;
            }
            this.delta.copyFrom(signal); // delta = \xi
            this.delta.subtract(cur.position); // delta -= w_bmu
            this.delta.multiplyBy(ada); // delta *= eps_b
            cur.position.add(this.delta); //adapt
        }
    }
}

VBNN.prototype.adaptGG = function (signal) {
    // determine Manhatten distance to each unit
    // adapt according to NG function(t,delta,sigma)

    var bmu = this.findBMU(signal);
    glob.mostRecentBMU = bmu;
    bmu.error += 1.0
    //
    // adapt according to SOM functions
    //
    var t = signalsPresented;
    var epsilon = glob.gg_eps_i
    //var epsilon = glob.gg_eps_i*Math.pow(glob.gg_eps_f/glob.gg_eps_i,t/1.0/glob.som_t_max);
    var sigma = glob.gg_sigma;
    for (var x = 0; x < this.n1; x++) {
        for (var y = 0; y < this.n2; y++) {
            var d = Math.abs(x - bmu.x) + Math.abs(y - bmu.y);
            var hrs = Math.exp(-d * d / (2 * sigma * sigma));
            var cur = this.nvec[x + this.n1 * y];
            var ada = epsilon * hrs;
            if (ada > 0.08) {
                //cur.somne=true;
                cur.adaptRank = 0;
            } else if (ada > 0.02) {
                cur.adaptRank = 1;
            } else {
                cur.adaptRank = -1;
                //cur.somne=false;
            }
            this.delta.copyFrom(signal); // delta = \xi
            this.delta.subtract(cur.position); // delta -= w_bmu
            this.delta.multiplyBy(ada); // delta *= eps_b
            cur.position.add(this.delta); //adapt
        }
    }
}
VBNN.prototype.adaptLBG = function (signal) {
    // find bmu
    var i,
        cv,
        cn;
    var glob_gng_age_max = glob.gng_age_max;
    //
    // just find winner for this signal and store signal in
    // sum of input signals for this unit
    //

    // bogus loop just to find an arbitrary unit for start values (break in the first run)
    for (i in this.nodes) {
        cn = this.nodes[i];
        break;
    }

    var curdist = 0;
    var mindist = Number.MAX_VALUE;
    var min2dist = Number.MAX_VALUE;
    var bmu = undefined,
        bmu2 = undefined;
    // loop over all nodes, comparing square distances
    for (i in this.nodes) {
        //cl(i);
        cn = this.nodes[i];
        cv = cn.position;
        // my own sqdist
        curdist = (cv.x - signal.x) * (cv.x - signal.x) + (cv.y - signal.y) * (cv.y - signal.y) + (cv.z - signal.z) * (cv.z - signal.z);
        if (curdist < mindist) {
            // new closest one
            // closest gets new value
            if (bmu) {
                // we already have a bmu from previous iteration
                min2dist = mindist;
                bmu2 = bmu;
            }
            mindist = curdist;
            bmu = cn;
        } else {
            // check if new 2nd closest
            if (curdist < min2dist) {
                min2dist = curdist;
                bmu2 = cn;
            }
        }
    }
    if (signal.sigbmu != bmu.id) {
        // bmu for this signal has changed
        glob.anyChangeBMU = true;
    }
    // store bmu at current signal
    signal.sigbmu = bmu.id;
    if (bmu2 && (bmu.id === bmu2.id)) {
        cl("same same bmu bmu2: " + bmu.id);
    }
    // add error
    bmu.error += mindist;

    // add utility
    bmu.utility += min2dist - mindist;

    // add signal to mean
    bmu.meanVec.add(signal);
    bmu.meanNo++;
    return mindist; // sqare error for this signal
}

// this will be dynamically replaced by the adapt for the current model
VBNN.prototype.adapt = function (signal) {}

VBNN.prototype.adaptHCL = function (signal) {
    var bmu = this.findBMU(signal);
    glob.mostRecentBMU = bmu;
    // adapt bmu
    this.delta.copyFrom(signal); // delta = \xi
    this.delta.subtract(bmu.position); // delta -= w_bmu
    this.delta.multiplyBy(glob.hcl_eps_i); // delta *= eps_b
    bmu.position.add(this.delta); //adapt bmu
}

VBNN.prototype.adaptGNG = function (signal, checkUtil) {
    // find bmu
    var i,
        cv,
        cn;
    var glob_gng_age_max = glob.gng_age_max;
    //
    // for networks with no or only local neigborhood
    //

    // bogus loop just to find an arbitrary unit for start values (break in the first run)
    for (i in this.nodes) {
        cn = this.nodes[i];
        meu = cn;
        luu = cn;
        break;
    }

    var curdist = 0;
    var mindist = Number.MAX_VALUE;
    var min2dist = Number.MAX_VALUE;
    var bmu = undefined,
        bmu2 = undefined,
        luu,
        meu; // luu = least useful unit; max error unit
    // loop over all nodes, comparing square distances
    var decay = 1 - glob.gng_beta;

    //
    // find bmu, bmu2, luu, meu
    // luu = least useful
    //var nonu=0;
    for (i in this.nodes) {
        cn = this.nodes[i];
        cv = cn.position;
        if (cv.x === null) {
            cl("null-alarm ......");
            debugger;
        }
        // my own sqdist
        var dx = cv.x - signal.x;
        var dy = cv.y - signal.y;
        var dz = cv.z - signal.z;
        curdist = dx * dx + dy * dy + dz * dz;
        //curdist=(cv.x-signal.x)*(cv.x-signal.x) + (cv.y-signal.y)*(cv.y-signal.y);
        //cl("VBNN.prototype.adaptGNG curdis for node " + i +" = "+curdist);
        if (curdist <= mindist) {
            // new minimum distance
            // closest gets new value
            if (bmu) {
                // we already had a bmu from a previous iteration, this now becomes bmu2
                bmu2 = bmu;
                // we remember the distance between signal and bmu2
                min2dist = mindist; //
            }
            // new bmu is set
            bmu = cn;
            // the distance between signal and new bmu is remembered
            mindist = curdist;
        } else {
            // no new minimum distance
            if (curdist <= min2dist) {
                // at least a new second-best distance
                bmu2 = cn;
                // store new second-best distance
                min2dist = curdist;
            }
        }
        if (!bmu) {
            cl("sorry, no bmu");
            cl("signal:");
            cd(signal); // ok
            cl("current vector:");
            cd(cv); // x and y are null sometimes, recently just x!
            cd(this.nodes);
            debugger;
        }
        // assertion: after first run bmu ist set!
        // search for minimum utility
        if (cn.utility < luu.utility) {
            luu = cn;
        }
        // search for max Error
        if (cn.error > meu.error) {
            meu = cn;
        }
        cn.error *= decay;
        cn.utility *= decay;
    } // loop over all nodes
    if (!bmu2) {
        cl("NO BMU2 ..... !!!!!!! noOfNodes:" + this.noOfNodes);
        debugger;
    }
    glob.mostRecentBMU = bmu;
    // add error
    bmu.error += mindist; // bmu sometimes undefined!!!
    // add utility
    bmu.utility += min2dist - mindist;
    // add edge if not yet present and no freezeStructure set
    if (bmu2 && !bmu.isNeighborOf(bmu2) && !glob.freezeStructure) {
        // add new edge between bmu and bmu3
        this.addEdge(bmu, bmu2);
    }
    // global edge aging - for efficiency only sometimes, depending on network size
    var edgesToRemove = [];
    if (doGlobalEdgeAging && signalsPresented % this.noOfNodes === 0) {
        // age all edges
        for (i in this.edges) {
            this.edges[i].age++;
            if (this.edges[i].age > glob_gng_age_max) {
                // edge too old: remove!
                this.edges[i].moriturus = true; // bound to die for the non-Romans :-)
                edgesToRemove.push(this.edges[i]);
            }
        }
    }
    // locally age all edges of bmu
    for (i in bmu.edges) {
        var ecur = bmu.edges[i];
        ecur.age++;
        // is bmu2 also part of this edge? if so, re-set its age!!!!
        if (bmu2.id in ecur.nodes) {
            ecur.age = 0; // re-set
        }
        // now check for old edges
        if (ecur.age > glob_gng_age_max) {
            // edge too old: remove!
            // check if edge is already marked for removal
            if (!ecur.moriturus) {
                // mark for removal
                ecur.moriturus = true;
                // add to removal list
                edgesToRemove.push(ecur);
            }
        }
    }
    // adapt bmu
    this.delta.copyFrom(signal) // delta = \xi
        .subtract(bmu.position) // delta -= w_bmu
        .multiplyBy(glob.gng_eps_b); // delta *= eps_b
    bmu.position.add(this.delta); //adapt bmu

    // adapt direct neighbors
    for (i in bmu.neighbors) { // if no neighbors this is skipped
        this.delta.copyFrom(signal) // delta = \xi
            .subtract(bmu.neighbors[i].position) // delta -= w_neighbor
            .multiplyBy(glob.gng_eps_n); // delta *= eps_n
        bmu.neighbors[i].position.add(this.delta); // adapt neighbor
    }

    if (edgesToRemove.length > 0 && !glob.freezeStructure) {
        this.removeEdges(edgesToRemove);
    }

    // utility-based removal
    if (checkUtil && this.noOfNodes > 2 && glob.gng_doUtility) {
        // check unit with least utility
        if (luu.utility * glob.gng_utilfac < meu.error || this.noOfNodes > glob.gng_n_max) { // TODO: reasonable value
            // remove unit with minUtil
            var moriturusNode = luu;
            if (!glob.freezeStructure) {
                //if (debug) {cl("take away "+moriturus.id);}
                this.removeNode(moriturusNode);
            }
        }
        // remove unit with minutil
    }
}
VBNN.prototype.adaptCHL = function (signal) {
    var x = this.findBMU2(signal);
    var bmu = x[0]
    var bmu2 = x[1];
    glob.mostRecentBMU = bmu;
    if (bmu.id === bmu2.id) {
        cl("same same bmu bmu2: " + bmu.id);
    }
    if (!bmu.isNeighborOf(bmu2)) {
        // add new edge between bmu and bmu3
        this.addEdge(bmu, bmu2);
    }
}

function disp(x, txt) {
    txt = txt || "no specs:";
    cl(txt + " " + JSON.stringify(x, null, 4));
}
/*
function indexOfSmallest(a) {
var lowest = 0;
for (var i = 1; i < a.length; i++) {
if (a[i] < a[lowest]) lowest = i;
}
return lowest;
}

function indexOfTwoSmallest(a) {
var bmu_i = 0;
var bmu2_i= 0;
for (var i = 1; i < a.length; i++) {
if (a[i] < a[bmu_i]) bmu_i = i
else if (a[i] < a[bmu2_i]) bmu2_i = i;
}
return [bmu_i,bmu2_i];
}
 */
// from node a to node b
function Edge(a, b) {
    if (a.id === b.id) {
        cl("Ooops! new edge from " + a.id + " to " + b.id);
    } else {
        //cl("ok:           new edge from " + a.id + " to " + b.id);
    }
    this.id = "edge#" + edgeid++;
    this.nodes = {};
    this.nodes[a.id] = a; //this.nodes."node001" = nn.nodes."node001"
    this.nodes[b.id] = b;
    this.age = 0;
    this.idx = -1;
    this.moriturus = false;
    // add edge to both nodes
    a.edges[this.id] = this;
    b.edges[this.id] = this;
    // add nodes as neighbors to each other (redundant)
    a.neighbors[b.id] = b;
    b.neighbors[a.id] = a;
}

Edge.prototype.bio = function (remark) {
    var txt = remark || "";
    txt += "::" + this.id + " from ";
    for (var i in this.nodes) {
        txt += this.nodes[i].id + " ---- ";
    }
    cl(txt);
}

Edge.prototype.vanish = function () {
    // remove itself from edge lists of a and back
    // remove b from neighbors of a
    // remove a from neighbors of b
    var i;
    var a = undefined;
    var b = undefined;
    var orphaned = [];
    // loop over both nodes of this edge
    for (var i in this.nodes) {
        if (!a) {
            a = this.nodes[i];
        } else {
            if (!b) {
                b = this.nodes[i];
            }
        }
    }
    // remove me from edge list of a
    delete a.edges[this.id];
    // remove me from edge list of b
    delete b.edges[this.id];
    // remove b from  neighbor list of a
    delete a.neighbors[b.id];
    // remove a from neighbor list of b
    delete b.neighbors[a.id];
    osize(a.edges) === 0 && orphaned.push(a)
    osize(b.edges) === 0 && orphaned.push(b)
    return orphaned


}
Edge.prototype.draw = function () {
    //cl("draw edges");
    var a = undefined;
    var b = undefined;
    for (var i in this.nodes) {
        if (!a) {
            a = this.nodes[i];
        } else {
            if (!b) {
                b = this.nodes[i];
            }
        }
    }
    var p1 = a.position;
    var p2 = b.position;
    ctx.beginPath();
    ctx.moveTo(xscale(p1.x), yscale(p1.y));
    ctx.lineTo(xscale(p2.x), yscale(p2.y));
    ctx.stroke(); // Draw it
    /*
    if (debug) {
    ctx.strokeStyle="black";
    ctx.strokeText(this.id + " " + this.age,xscale((p1.x+p2.x)/2),xscale((p1.y+p2.y)/2));
    }
     */
}
//
// Node
//
function Node(point) {

    this.position = point || new Vector();
    this.meanVec = new Vector(); // for LBG
    this.meanVec.nullify(); // for LBG
    this.meanNo = 0; // for LBG display
    this.edges = {}; // all edges this node is part of
    this.trace = []; //position trace
    this.neighbors = {}; // all opposite nodes of the above edges
    this.color = '#' + (16777216 + Math.floor(Math.random() * 16777215)).toString(16).substring(1);
    this.color0 = this.color; // to restore in case of temporary colorings
    this.init(); // Node
}

Node.prototype.bio = function (remark) {
    var txt = remark || "";
    cl(txt + this.id //"U: " + this.utility + "  E: " + this.error
        +
        " #edge" + osize(this.edges) + " #neighb: " + osize(this.neighbors));
}

Node.prototype.restore = function () {
    this.color = this.color0;
}
Node.prototype.init = function () {
    this.id = "node#" + nodeid++;
    this.error = 0;
    this.utility = 0;
}
Node.prototype.setUtility = function (u) {
    this.utility = u;
    if (!isFinite(this.utility)) {
        alert("inifinity 1");
        debugger;
    }
}
Node.prototype.incUtility = function (u) {
    this.utility += u;
    if (!isFinite(this.utility)) {
        alert("inifinity 2");
        debugger;
    }
}

Node.prototype.isNeighborOf = function (n) {
    if (n) {
        return (n.id in this.neighbors);
    } else {
        cl("haehh, Node.prototype.isNeighborOf n is not defines .....");
        return false;
    }
}

//
// draw error/utility as circles of varying size
//
Node.prototype.drawParams = function () {
    ctx.globalAlpha = 0.5;
    // if(this.hasOwnProperty("utility")) {
    // cl("no fallback:"+this.utility);
    // if (!isFinite(this.utility)){
    // this.utility = 5;
    // cl("changed infinity to "+this.utility);
    // }
    // } else {
    // cl("fallback");
    // this.utility = 10;
    // }

    if (glob.gng_showError) {
        // error
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.position.x * can2D.width, this.position.y * can2D.height, Math.max(this.error * glob.numfac, 1), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    if (glob.gng_showUtility) {
        // utility
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.position.x * can2D.width, this.position.y * can2D.height, Math.max(this.utility * glob.numfac, 1), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    // if (true) {
    // // error
    // ctx.fillStyle="yellow";
    // ctx.beginPath();
    // ctx.arc(this.position.x*can2D.width,this.position.y*can2D.height,Math.max(5,1),0,2*Math.PI);
    // ctx.fill();
    // ctx.stroke();
    // }
}
//
// fast version of draw - no frills
//
Node.prototype.drawbare = function () {
    ctx.fillStyle = "green"; //this.color;
    //var fac = 1;
    //
    ctx.beginPath();
    ctx.arc(this.position.x * can2D.width, this.position.y * can2D.height, glob.nodeDiameter, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

Node.prototype.drawfull = function () {
    if (glob.freezeStructure && !nn.isRigid) {
        ctx.fillStyle = glob.colors.freeze;
    } else if (glob.uniColorNodes) {
        ctx.fillStyle = Node.coli;
    } else {
        ctx.fillStyle = this.color;
    }
    var fac = 1;
    if (nn.model === "GG") { // GG
        if (this.x === nn.newCol || this.y === nn.newRow) {
            ctx.fillStyle = "yellow"; //glob.colors.inserted;
            fac = 1.5;
        }
    }
    if (nn.isLBGX) { // LBG or LBG-U
        if (nn.converged || (this.trace.length > 1 && this.position.dist(this.trace[1]) < 0.00001)) {
            ctx.fillStyle = glob.colors.converged;
        }
    } else {
        if (this.adaptRank === 0) {
            ctx.fillStyle = "#FF8888"; //glob.colors.adapt0;
            fac = 2;
        }
        if (this.adaptRank === 1) {
            ctx.fillStyle = "#FFDDDD"; //glob.colors.adapt1;
            fac = 1.5;
        }
        if ((glob.markBMU || glob.showSingleStep) && this === glob.mostRecentBMU) {
            ctx.fillStyle = "red"; //glob.colors.bmu;
            fac = 2;
            //glob.mostRecentBMU = "";
        }
    }
    ctx.beginPath();
    if (glob.markInserted && glob.gng_showLastInserted && nn.lastInserted === this) {
        ctx.fillStyle = "yellow"; //glob.colors.inserted;
        fac = 1.5;
    }
    if (glob.grabbedNode === this) {
        if (glob.realTouchContact) {
            fac = 10;
        } else {
            fac = 3;
        }
    } else if (pingedNode === this) {
        fac = 2;
    }
    ctx.arc(this.position.x * can2D.width, this.position.y * can2D.height, glob.nodeDiameter * fac, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}
Node.prototype.draw = Node.prototype.drawfull;
//
// Vector
//
function Vector(x, y, z) {
    this.x = (typeof x !== 'undefined') ? x : 0;
    this.y = (typeof y !== 'undefined') ? y : 0;
    this.z = (typeof z !== 'undefined') ? z : 0;
    return this;
}

Vector.prototype.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    return this;
}

Vector.prototype.subtract = function (vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
}

Vector.prototype.copyFrom = function (v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
}

Vector.prototype.multiplyBy = function (f) {
    this.x *= f;
    this.y *= f;
    this.z *= f;
    return this;
}

Vector.prototype.myprint = function (str) {
    str = str || "";
    cl(str + "x:" + this.x + " y:" + this.y + " z:" + this.z);
}

Vector.prototype.randomize = function () {
    this.x = Math.random();
    this.y = Math.random();
    this.z = 0;
    return this;
}
Vector.prototype.randomize2 = function () {
    this.x = Math.random();
    this.y = Math.random();
    this.z = 0;
    return this;
}
Vector.prototype.randomize3 = function () {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();
    return this;
}
Vector.prototype.nullify = function () {
    this.x = 0.0;
    this.y = 0.0;
    this.z = 0.0;
    return this;
}
Vector.prototype.setTo = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = (typeof z !== 'undefined') ? z : 0;
    return this;
}

Vector.prototype.sqdist = function (vector) {
    var dx = this.x - vector.x;
    var dy = this.y - vector.y;
    var dz = this.z - vector.z;
    return dx * dx + dy * dy + dz * dz;
}

Vector.prototype.dist = function (vector) {
    var dx = this.x - vector.x;
    var dy = this.y - vector.y;
    var dz = this.z - vector.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
Vector.prototype.rotate = function (angle) {
    this.x -= 0.5;
    this.y -= 0.5;
    var xn = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    var yn = this.y * Math.cos(angle) + this.x * Math.sin(angle);
    //x' = x cos f - y sin f
    //y' = y cos f + x sin f
    this.x = xn + 0.5;
    this.y = yn + 0.5;
    return this;
}
var lastSignal = new Vector

/*
// Vector.prototype.sqdist = function(vector) {
// var dx = this.x - vector.x;
// var dy = this.y - vector.y;
// return dx*dx+dy*dy;
// }

// Vector.prototype.getMagnitude = function() {
// return Math.sqrt(this.x * this.x + this.y * this.y);
// };

// Vector.prototype.getAngle = function() {
// return Math.atan2(this.y,this.x);
// };

// Vector.fromAngle = function(angle, magnitude) {
// return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
// };
*/
