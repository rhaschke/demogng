//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

/*global $, glob3D, glob, cl, nn, pds, curpd, requestAnimationFrame, THREE*/
/*jslint vars: true, devel: true, nomen: true, indent: 4, maxerr: 100, plusplus: true */
"use strict";
var maxSignalCount = 4000;
var infinity = 0; //1000000.;
var offsetsA;
var lvertices;
var linePosA;
var tracePosA;
var signalPosA;

var signalObject;
var lineObject;
var traceObject;
var nodeObject;
var pdObject;

var axesObject;
var planeObject;
var frameObject;
var unitCubeObject;
var haveTrace = true;

function myRemove(o) {
    glob3D.scene.remove(o);
    if (o.material) {
        o.material.dispose();
    }
    if (o.texture) {
        o.texture.dispose();
    }
    if (o.geometry) {
        o.geometry.dispose();
    }
}

var controls = "";
var stats = "";
var realtime = Date.now();
var stamp_x = 0;
var stamp_y = 0;
var stamp_z = 0;

function getRealtime() {
    return Date.now();
}
var timefac = 0.0002;
var hudctx;
var hudTexture;
var sceneHUD;
var cameraHUD;

var render = function () {
    realtime = Date.now();

    if (!glob.running) {
        requestAnimationFrame(render);
    }
    if (glob._3DROT_X || glob._3DROT_Y || glob._3DROT_Z || glob._3DROT_XM || glob._3DROT_YM || glob._3DROT_ZM) {
        glob3D.scene.translateX(0.5);
        glob3D.scene.translateY(0.5);
        glob3D.scene.translateZ(0.5);
        if (glob._3DROT_X) {
            glob3D.scene.rotation.x += (realtime - stamp_x) * timefac; //+=0.001
            stamp_x = realtime;
        } else if (glob._3DROT_XM) {
            glob3D.scene.rotation.x -= (realtime - stamp_x) * timefac; //+=0.001
            stamp_x = realtime;
        }
        if (glob._3DROT_Y) {
            glob3D.scene.rotation.y += (realtime - stamp_y) * timefac; //+=0.001
            stamp_y = realtime;
        } else if (glob._3DROT_YM) {
            glob3D.scene.rotation.y -= (realtime - stamp_y) * timefac; //+=0.001
            stamp_y = realtime;
        }
        if (glob._3DROT_Z) {
            glob3D.scene.rotation.z += (realtime - stamp_z) * timefac; //+=0.001
            stamp_z = realtime;
        } else if (glob._3DROT_ZM) {
            glob3D.scene.rotation.z -= (realtime - stamp_z) * timefac; //+=0.001
            stamp_z = realtime;
        }
        glob3D.scene.translateX(-0.5);
        glob3D.scene.translateY(-0.5);
        glob3D.scene.translateZ(-0.5);
    }
    controls.update(0.01);
    glob3D.renderer.clear();
    glob3D.renderer.render(glob3D.scene, glob3D.camera);
};


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//
// initialize 3D scene ........
//
function M3D(maxNodes, maxEdges) {
    M3D.init(maxNodes, maxEdges);
}

M3D.showSignalsFun = function () {
    if (glob.showSignals === true || (nn && nn.isLBGX && glob.showPDs)) {
        cl("add 3D signal cloud");
        glob3D.scene.add(signalObject);
    } else {
        cl("remove 3D signal cloud");
        glob3D.scene.remove(signalObject);
    }
};

M3D.showTraceEdgesFun = function () {
    if (haveTrace) {
        if (glob.showTrace === true) {
            cl("add trace edges");
            glob3D.scene.add(traceObject);
        } else {
            cl("remove trace edges");
            glob3D.scene.remove(traceObject);
        }
    }
};

M3D.showEdgesFun = function () {
    if (glob.showEdges === true) {
        cl("add edges");
        glob3D.scene.add(lineObject);
    } else {
        cl("remove edges");
        glob3D.scene.remove(lineObject);
    }
};
M3D.showPlaneFun = function () {
    if (glob.showPlane === true) {
        glob3D.scene.add(planeObject);
    } else {
        glob3D.scene.remove(planeObject);
    }
};
M3D.showUnitCubeFun = function () {
    if (glob.showUnitCube === true) {
        glob3D.scene.add(unitCubeObject);
    } else {
        glob3D.scene.remove(unitCubeObject);
    }
};
M3D.showAxesFun = function () {
    if (glob.showAxes === true) {
        glob3D.scene.add(axesObject);
    } else {
        glob3D.scene.remove(axesObject);
    }
};
M3D.showFrameFun = function () {
    if (glob.showFrame === true) {
        glob3D.scene.add(frameObject);
    } else {
        glob3D.scene.remove(frameObject);
    }
};

M3D.showNodesFun = function () {
    if (glob.showNodes === true) {
        cl("add nodes");
        glob3D.scene.add(nodeObject);
    } else {
        cl("remove nodes");
        glob3D.scene.remove(nodeObject);
    }
};

M3D.showPDsFun = function () {
    M3D.showSignalsFun();
    if (glob.showPDs === true) {
        cl("show pd");
        if (pds[curpd].ready) {
            glob3D.scene.add(pdObject);
        } else {
            nn.castPD();
        }
    } else {
        if (pds[curpd].ready) {
            cl("remove pd");
            glob3D.scene.remove(pdObject);
        } else {
            cl("hide pd");
            nn.hidePD();
        }
    }
};

// WebGL has different orientation of y-axis! Thus 1-y;
M3D.setNode = function (i, v) {
    offsetsA.setXYZ(i, v.x, 1 - v.y, v.z);
};

M3D.setEdge = function (i, v, w) {
    linePosA.setXYZ(i * 2 + 0, v.x, 1 - v.y, v.z);
    linePosA.setXYZ(i * 2 + 1, w.x, 1 - w.y, w.z);
};

M3D.setTraceEdge = function (i, v, w) {
    tracePosA.setXYZ(i * 2 + 0, v.x, 1 - v.y, v.z);
    tracePosA.setXYZ(i * 2 + 1, w.x, 1 - w.y, w.z);
};
var sigi = 0;
M3D.setSignal = function (v) {
    // circle buffer
    sigi = (sigi + 1) % maxSignalCount;
    // set current signal (possibly overriding an old one)
    signalPosA.setXYZ(sigi, v.x, 1 - v.y, v.z);
    //cl("sigi = "+sigi);
};

// clear all signals (by moving them out of sight)
M3D.clearSignals = function (v) {
    var i;
    cl("M3D.clearSignals()");
    for (i = 0; i < maxSignalCount; i++) {
        signalPosA.setXYZ(i, 0, 0, 1000000);
    }
    sigi = 0;
};

M3D.reset = function () {
    var i;
    cl("M3D.reset()");
    for (i = 0; i < M3D.maxNodes; i++) {
        offsetsA.setXYZ(i, 1000, 1000, 1000);
    }
    for (i = 0; i < M3D.maxEdges * 2; i++) {
        linePosA.setXYZ(i, 1000, 1000, 1000);
    }
    if (haveTrace) {
        for (i = 0; i < M3D.maxTraceEdges * 2; i++) {
            tracePosA.setXYZ(i, 1000, 1000, 1000);
        }
        prevTraceEdges = 0;
    }
};

M3D.offsetsNeedsUpdate = function () {
    offsetsA.needsUpdate = true;
    linePosA.needsUpdate = true;
    if (haveTrace) {
        tracePosA.needsUpdate = true;
    }
};

M3D.signalsNeedsUpdate = function () {
    signalPosA.needsUpdate = true;
};


M3D.addGroup = function () {
    var group = new THREE.Object3D(); //create an empty container
    group.isGroup = true;
    return group;
};

var nopa = 0.5;
M3D.addBox = function (a, b, c, xoff, yoff, zoff, col) {
    // add plane
    var geometrybf = new THREE.BoxGeometry(a, b, c);
    var materialbf = new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: nopa
    });
    var box = new THREE.Mesh(geometrybf, materialbf);
    box.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(box);
    return box;
};

M3D.addEdgeBox = function (a, b, c, xoff, yoff, zoff, col, solidToo, wireToo) {
    // add edge box
    solidToo = solidToo || false;
    if (typeof wireToo === "undefined") {
        wireToo = true;
    }
    var geometrybf = new THREE.BoxGeometry(a, b, c);
    var group = new THREE.Object3D();
    var line;
    if (solidToo) {
        var materialbf = new THREE.MeshStandardMaterial({
            color: col,
            transparent: true,
            opacity: 0.2
        });
        line = new THREE.Mesh(geometrybf, materialbf);
        group.add(line);
    }

    if (wireToo) {
        var edges = new THREE.EdgesGeometry(geometrybf);
        line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.8
        }));
        group.add(line);
    }

    group.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(group);
    return group;
};

M3D.addCylinder = function (r, h, xoff, yoff, zoff, col) {
    // add cylinder
    var geometrybf = new THREE.CylinderGeometry(r, r, h, 20, 20);
    var materialbf = new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: nopa
    });
    var cylinder = new THREE.Mesh(geometrybf, materialbf);
    cylinder.rotateX(Math.PI / 2);
    cylinder.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(cylinder);
    return cylinder;
};

M3D.addEdgeCylinder = function (r, h, xoff, yoff, zoff, col, solidToo, wireToo) {
    // add edge box
    solidToo = solidToo || false;
    if (typeof wireToo === "undefined") {
        wireToo = true;
    }
    var geometrybf = new THREE.CylinderGeometry(r, r, h, 20, 20);
    var group = new THREE.Object3D();
    if (solidToo) {
        var materialbf = new THREE.MeshStandardMaterial({
            color: col,
            transparent: true,
            opacity: 0.2
        });
        var edgeCylinder = new THREE.Mesh(geometrybf, materialbf);
        edgeCylinder.rotateX(Math.PI / 2);
        edgeCylinder.position.set(xoff, yoff, zoff);
        group.add(edgeCylinder);
    }
    if (wireToo) {
        var edges = new THREE.EdgesGeometry(geometrybf);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.5
        }));
        line.rotateX(Math.PI / 2);
        line.position.set(xoff, yoff, zoff);
        group.add(line);
    }

    glob3D.pd_objects.push(group);
    return group;
};
/*
var points = [];
for ( var i = 0; i < 10; i ++ ) {
	points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
}
var geometry = new THREE.LatheGeometry( points );
var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
var lathe = new THREE.Mesh( geometry, material );
scene.add( lathe );
*/
M3D.addEdgeTube = function (r, h, xoff, yoff, zoff, col, solidToo, wireToo) {
    // add edge box
    solidToo = solidToo || false;
    if (typeof wireToo === "undefined") {
        wireToo = true;
    }
    var points = [];
    points.push(new THREE.Vector2(r, 0));
    points.push(new THREE.Vector2(r, h));
    var geometrybf = new THREE.LatheGeometry(points);
    //var geometrybf = new THREE.CylinderGeometry(r, r, h, 20, 20);
    var group = new THREE.Object3D();
    if (solidToo) {
        var materialbf = new THREE.MeshStandardMaterial({
            color: col,
            transparent: true,
            opacity: 0.2
        });
        var edgeTube = new THREE.Mesh(geometrybf, materialbf);
        edgeTube.rotateX(Math.PI / 2);
        edgeTube.position.set(xoff, yoff, zoff);
        group.add(edgeTube);
    }
    if (wireToo) {
        var edges = new THREE.EdgesGeometry(geometrybf);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.5
        }));
        line.rotateX(Math.PI / 2);
        line.position.set(xoff, yoff, zoff);
        group.add(line);
    }

    glob3D.pd_objects.push(group);
    return group;
};

M3D.addEdgeCircle = function (r, xoff, yoff, zoff, col) {
    // add edge box
    //var solidToo = solidToo || false;
    var geometrybf = new THREE.CircleGeometry(r, 32);
    var edges = new THREE.EdgesGeometry(geometrybf);
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.5
    }));
    line.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(line);
    return line;
};

M3D.addEdgePlane = function (a, b, c, xoff, yoff, zoff, col) {
    // add edge box
    var geometrybf = new THREE.BoxGeometry(a, b, c);
    var edges = new THREE.EdgesGeometry(geometrybf);
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.5
    }));
    line.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(line);
    return line;
};

M3D.addRing = function (ir, or, xoff, yoff, zoff, col) {
    // add plane
    var geometrybf = new THREE.RingGeometry(ir, or, 20, 20);
    var materialbf = new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: nopa
    });
    var ring = new THREE.Mesh(geometrybf, materialbf);
    ring.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(ring);
    return ring;
};

M3D.addShape = function (p, h, xoff, yoff, zoff, col) {
    var i;
    // add shape
    var s = new THREE.Shape();
    s.moveTo(p[0].x, 1 - p[0].y);
    for (i = 1; i < p.length; i++) {
        s.lineTo(p[i].x, 1 - p[i].y);
    }
    var extrudeSettings = {
        amount: h,
        bevelEnabled: false,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.02,
        bevelThickness: 0.01
    };
    var geometry = new THREE.ExtrudeGeometry(s, extrudeSettings);
    var materialbf = new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: nopa
    });
    var shape = new THREE.Mesh(geometry, materialbf);
    shape.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(shape);
    return shape;
};

M3D.addEdgeShape = function (p, h, xoff, yoff, zoff, col, solidToo, wireToo) {
    var i;
    solidToo = solidToo || false;
    if (typeof wireToo === "undefined") {
        wireToo = true;
    }
    // add shape
    col = "#aaa";
    var s = new THREE.Shape();
    s.moveTo(p[0].x, 1 - p[0].y);
    for (i = 1; i < p.length; i++) {
        s.lineTo(p[i].x, 1 - p[i].y);
    }
    var extrudeSettings = {
        amount: h,
        bevelEnabled: false,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.02,
        bevelThickness: 0.01
    };
    var geometrybf = new THREE.ExtrudeGeometry(s, extrudeSettings);
    var group = new THREE.Object3D();
    var line;
    if (solidToo) {
        var materialbf = new THREE.MeshStandardMaterial({
            color: col,
            transparent: true,
            opacity: 0.2
        });
        line = new THREE.Mesh(geometrybf, materialbf);
        group.add(line);
    }
    if (wireToo) {
        var edges = new THREE.EdgesGeometry(geometrybf);
        line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.5
        }));
        group.add(line);
    }

    group.position.set(xoff, yoff, zoff);
    glob3D.pd_objects.push(group);
    return group;
};

var width;
var height;
M3D.init = function (maxNodes, maxEdges) {
    var i;
    M3D.maxEdges = maxEdges;
    M3D.maxNodes = maxNodes;
    M3D.maxTraceEdges = M3D.maxNodes * 10;
    var black = false;
    if (black) {
        var bgcolor = 0x000000;
        var edgecolor = 0x999999;
        var signalcolor = 0xFF5555;
    } else {
        var bgcolor = glob.colors.bg_3D;
        var edgecolor = glob.colors.edge_3D;
        var signalcolor = glob.colors.signal_3D; //0xFF0000;
    }
    glob3D.cubes = [];
    glob3D.pd_objects = []; // M3D.init()
    cl("************************* get ur balls ********************");
    //
    // **************** SCENE ***************
    //
    var scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0xf00, 0.25);
    //scene.fog = new THREE.Fog( 0xf00, 0.1,1.5);

    var wwid = window.innerWidth;
    width = wwid;
    var whei = window.innerHeight;
    height = whei;


    //
    // **************** CAMERA ***************
    //
    var camera = new THREE.PerspectiveCamera(75, wwid / whei, 0.1, 100);
    camera.position.x = 0.5;
    camera.position.y = -1.0;
    camera.position.z = 0.7;

    camera.lookAt(0.5, 0.5, 0);
    //camera.zoom = 1;

    //
    // **************** RENDERER ***************
    //
    var renderer = new THREE.WebGLRenderer({ /*alpha: true,*/
        antialias: true
    });
    renderer.setSize(wwid, whei);
    renderer.autoClear = false;
    renderer.setClearColor(bgcolor, 1);
    $("#div3d").empty(); // remove possible old canvase
    document.getElementById("div3d").appendChild(renderer.domElement);
    //stats = new Stats();
    //renderer.domElement.appendChild(stats.dom);
    //$(stats.dom).css({position: "absolute",top: 0, left: 0});
    //$(stats.dom).hide();
    //document.getElementById("div3d").appendChild(stats.dom);
    //
    // **************** PLANE ***************
    //
    var geometrybf = new THREE.BoxGeometry(1, 1, 0.01);
    var materialbf = new THREE.MeshStandardMaterial({
        color: 0xf27,
        transparent: true,
        opacity: 0.6
    });
    planeObject = new THREE.Mesh(geometrybf, materialbf);
    planeObject.position.set(0.5, 0.5, -0.013);

    //
    // **************** Unit Cube ***************
    //
    var geometrybf = new THREE.BoxGeometry(1, 1, 1);
    var edges = new THREE.EdgesGeometry(geometrybf);
    unitCubeObject = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: "#668",
        transparent: false,
        opacity: 0.7
    }));
    unitCubeObject.position.set(0.5, 0.5, 0.5);


    //
    // **************** WIRE FRAME ***************
    //
    var material = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    var geometry = new THREE.Geometry();
    var h = -0.01;
    geometry.vertices.push(
        new THREE.Vector3(-0, 0, h),
        new THREE.Vector3(0, 1, h),
        new THREE.Vector3(1, 1, h),
        new THREE.Vector3(1, 0, h),
        new THREE.Vector3(0, 0, h)
    );
    frameObject = new THREE.Line(geometry, material);

    //
    // **************** MOUSE CONTROL ***************
    //
    var control = "flyx";
    if (control === "fly") {
        controls = new THREE.FlyControls(camera, renderer.domElement);

        controls.movementSpeed = 1;
        controls.domElement = renderer.domElement;
        controls.rollSpeed = Math.PI / 24;
        controls.autoForward = false;
        controls.dragToLook = false;


    } else {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.z = 0.5; // center is now 0.5,0.5,0.5
        //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
        controls.enableDamping = false;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.enableKeys = false; // enabled on enter
    }
    //
    // **************** LIGHTS ***************
    //
    var light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);

    // create point light #1
    var pointLight =
        new THREE.PointLight(0xFFFFFF);

    // set its position
    pointLight.position.x = 3.0;
    pointLight.position.y = 3.0;
    pointLight.position.z = 3.0;

    // create point light #2
    var pointLight2 =
        new THREE.PointLight(0xcccccc);

    // set its position
    pointLight2.position.x = 50;
    pointLight2.position.y = 10;
    pointLight2.position.z = -40;

    // add to the scene
    scene.add(pointLight);
    scene.add(pointLight2);

    //
    // **************** NODES ***************
    //

    // Instanced Buffer Geometry w. Shader Material
    var vShader = $('vertexShader');
    var fShader = $('fragmentShader');
    var iscube_material = new THREE.ShaderMaterial({
        defines: {
            FOO: 15,
            BAR: true
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        wireframe: false
    });
    //if (false && isMobile.any()) {
    //    var iscube_geometry = new THREE.TetrahedronGeometry(0.02, 0);
    //} else {
    var iscube_geometry = new THREE.SphereGeometry(0.015, 8, 8);
    //}
    var edge = 0.018;
    //var iscube_geometry = new THREE.BoxGeometry(edge, edge, edge);
    //var iscube_geometry = new THREE.TorusGeometry( edge*3, edge, 16, 40 );
    var isgeometry = new THREE.InstancedBufferGeometry().fromGeometry(iscube_geometry);
    isgeometry.maxInstancedCount = M3D.maxNodes;

    var instances = M3D.maxNodes;
    var off = 1.0;
    offsetsA = new THREE.InstancedBufferAttribute(new Float32Array(instances * 3), 3, 1);
    var ul;
    for (i = 0, ul = offsetsA.count; i < ul; i++) {
        offsetsA.setXYZ(i, 1000, 1000, 1000);
    }
    isgeometry.addAttribute('offset', offsetsA);

    var colors = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1);
    for (i = 0, ul = colors.count; i < ul; i++) {
        //colors.setXYZW(i, Math.random(), Math.random(), Math.random(), Math.random());
        //colors.setXYZW(i, 0.8, 0.8, 0.8, 0.8);
        colors.setXYZW(i, 0.7, 1.0, 0.7, 1.0);
    }
    isgeometry.addAttribute('color', colors);

    instances = isgeometry.maxInstancedCount;
    nodeObject = new THREE.Mesh(isgeometry, iscube_material);
    nodeObject.frustumCulled = false;
    //scene.add(nodeObject);

    //
    // **************** AXIS SYSTEM ***************
    //

    // The X axis is red. The Y axis is green. The Z axis is blue.
    axesObject = new THREE.AxisHelper(1.0);
    //scene.add(axesObject);

    //
    // **************** EDGES ***************
    //

    // line material
    material = new THREE.LineBasicMaterial({
        color: edgecolor
    });
    var lvertices = [];
    for (i = 0; i < M3D.maxEdges * 2; i++) {
        lvertices.push(new THREE.Vector3(Math.random() * 1, Math.random() * 1000, Math.random() * 1));
    }

    var linePos = new Float32Array(lvertices.length * 3);

    for (i = 0; i < lvertices.length; i++) {
        linePos[i * 3 + 0] = lvertices[i].x;
        linePos[i * 3 + 1] = lvertices[i].y;
        linePos[i * 3 + 2] = lvertices[i].z;
    }

    geometry = new THREE.BufferGeometry();
    linePosA = new THREE.BufferAttribute(linePos, 3);
    geometry.addAttribute('position', linePosA);

    lineObject = new THREE.LineSegments(geometry, material);

    //
    // **************** TRACE EDGES ***************
    //
    if (haveTrace) {
        // line material
        var hmaterial = new THREE.LineBasicMaterial({
            color: "red",
            transparent: false,
            opacity: 0.8
        });
        var hvertices = [];
        for (i = 0; i < M3D.maxTraceEdges * 2; i++) {
            hvertices.push(new THREE.Vector3(Math.random(), Math.random(), Math.random() + 2));
            //hvertices.push(new THREE.Vector3(0.5, 0.5, Math.random() * 10.-5.));
        }
        cl("hvertices.length: " + hvertices.length + " coord: " + hvertices[0].x);

        var tracePos = new Float32Array(hvertices.length * 3);

        for (i = 0; i < hvertices.length; i++) {
            tracePos[i * 3 + 0] = hvertices[i].x;
            tracePos[i * 3 + 1] = hvertices[i].y;
            tracePos[i * 3 + 2] = hvertices[i].z;
        }

        var hgeometry = new THREE.BufferGeometry();
        tracePosA = new THREE.BufferAttribute(tracePos, 3);
        hgeometry.addAttribute('position', tracePosA);

        traceObject = new THREE.LineSegments(hgeometry, hmaterial);
    }
    //
    // **************** SIGNALS ***************
    //
    var pMaterial = new THREE.PointsMaterial({
        color: signalcolor,
        size: 0.004, //3
        blending: THREE.AdditiveBlending,
        transparent: false,
        opacity: 0.7,
        sizeAttenuation: true //isMobile.any()
    });

    var particlesData = [];
    var r = 1;
    var pGeometry = new THREE.BufferGeometry();
    var signalPos = new Float32Array(maxSignalCount * 3);

    for (i = 0; i < maxSignalCount; i++) {

        var x = Math.random() * r;
        var y = Math.random() * r;
        var z = Math.random() * r;

        signalPos[i * 3] = x;
        signalPos[i * 3 + 1] = y;
        signalPos[i * 3 + 2] = z;

    }

    // add it to the geometry
    pGeometry.setDrawRange(0, maxSignalCount);
    signalPosA = new THREE.BufferAttribute(signalPos, 3).setDynamic(true);
    pGeometry.addAttribute('position', signalPosA);

    // create the particle system
    signalObject = new THREE.Points(pGeometry, pMaterial);
    //
    // render
    //
    renderer.render(scene, camera);
    glob3D.scene = scene;
    glob3D.renderer = renderer;
    glob3D.camera = camera;
};
