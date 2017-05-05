//
// Copyright 2016-2017 by Bernd Fritzke, All Rights Reserved
//

//
// class LogPar: logical parameter
// class NumPar: numeric parameter
//
/*global cl, isIn, NumPar, PicPar, LogPar, SelPar, VBNN, setModelTo, setSpeedTo, glob, $, setDistributionTo, ui*/
/*jslint white: true */
"use strict";

function Par() {}

Par.all = {};
Par.exists = function (vName) {
    return isIn(vName, Object.keys(Par.all));
};

//
// general method to set a param
//
Par.set = function (vName, vValue) {
    if (isIn(vName, NumPar.names)) {
        NumPar.pars[vName].set(vValue);
    } else if (isIn(vName, LogPar.names)) {
        LogPar.pars[vName].set(vValue);
    } else if (isIn(vName, PicPar.names)) {
        PicPar.pars[vName].set(vValue);
    } else if (isIn(vName, SelPar.names)) {
        SelPar.pars[vName].set(vValue);
    } else {
        cl("ERROR: Par.set() can not find parameter " + vName + " and thus cannot set it to " + vValue);
    }
};

Par.toggle = function (vName) {
    cl("toggle .... " + vName);
    if (isIn(vName, LogPar.names)) {
        LogPar.pars[vName].toggle();
    }
};


SelPar.pars = {}; // contains the SelPar objects
SelPar.names = []; // sequence of names

NumPar.pars = {}; // contains the NumPar objects
NumPar.names = []; // sequence of names

PicPar.pars = {}; // contains the picture buttons objects
PicPar.names = []; // sequence of names

LogPar.pars = {}; // contains the LogPar objects
LogPar.names = []; // sequence of names
LogPar.prefix = "mycb_";

// Examples ......
//
// selectmenus
// $("#probDist").val(newpd).selectmenu("refresh");
// $("#model").val(newmodel).selectmenu("refresh");
//
//  image buttons (checkbuttons)
// $("#showPDs").prop('checked', true).button("refresh");
// $("#showSignals").prop('checked', false).button("refresh");
//
//

//
// data = {name: "model", list: VBNN.models}
//
function SelPar(data) {
    this.data = data;
    // store object in list
    SelPar.pars[data.name] = this;
    Par.all[data.name] = "selection";
    // store name in list
    SelPar.names.push(data.name);
}

//
// programmatically set this variable and update widget
//
SelPar.prototype.set = function (v) {
    switch (this.data.name) {
        case "model":
            if (VBNN.models.hasOwnProperty(v)) {
                setModelTo(v);
            } else {
                cl("++++++++++++++++++++ non-existing model:" + v);
            }
            break;
        case "distribution":
            setDistributionTo(v);
            break;
        case "speed":
            setSpeedTo(v);
            break;
        default:
            cl("ooopsi: SelPar.prototype.set" + v);
    }
};

//
// homebrewn buttons with 2 kinds of images for active/passive, replace at some point
//
function PicPar(data) {
    this.data = data;
    // store object in container
    PicPar.pars[data.name] = this;
    // store type in global container
    Par.all[data.name] = "picture";
    // store name in list
    PicPar.names.push(data.name);
    //cl("initializing glob."+data.name+" to "+data.value);
    glob[data.name] = data.value;
    // force value since firefix caches previous values
    document.getElementById(data.name).checked = data.value;
}

//
// programmatically set this variable and update widget
//
PicPar.prototype.set = function (b) {
    // id id showNodes, showEdges etc.
    var id = "#" + this.data.name;
    //cl("set "+ id);
    if ($(id).prop('checked') !== b) {
        cl("click:" + id);
        $(id).trigger("click");
    }
    if (this.data.hasOwnProperty("fun")) {
        this.data.fun();
    }
};
//Example: new LogPar( {model:"GNG", name: "showLastInserted", value: true});
//
function LogPar(data) {
    // name
    // value
    this.data = data;
    this.data.rem = data.rem || ""; // remark
    this.cbid = LogPar.prefix + data.name; // checkbox id
    // store object in lists
    LogPar.pars[data.name] = this; // list of all logpars (TODO: name must be unique)
    Par.all[data.name] = "logical"; // list of all pars
    // store name in list
    LogPar.names.push(data.name); // list of all logPar names
    // initialize global variable
    window.glob[data.name] = data.value; // initial value
}

//
// programmatically set this variable and update widget
//
LogPar.prototype.set = function (b) {
    // setting the checkbox
    if (b === "false" || b === "0") {
        b = false; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
    cl("LogPar.set() " + this.cbid + " --> " + b);
    //$("#"+this.cbid).prop('checked', b);
    document.getElementById(this.cbid).checked = b;
    // setting the associated global variable
    window.glob[this.data.name] = b;
    if (this.data.hasOwnProperty("fun")) {
        if ((typeof this.data.fun) === "string") {
            cl("LogPar.prototype.set(): is string ...." + this.data.name);
            window[this.data.fun](this);
        } else {
            cl("LogPar.prototype.set(): is no string ...." + this.data.name);
            this.data.fun();
        }
    }
};

LogPar.prototype.toggle = function () {
    // setting the checkbox
    if ($("#" + this.cbid).prop('checked')) {
        this.set(0);
    } else {
        this.set(1);
    }
};

LogPar.prototype.animate = function () {
    var me = this; // save for closure ....
    $(function () {
        var id = "#" + me.cbid;
        //cl("animate: "+id);
        // attach change function to checkbox-click which changes the global variable
        $(id).click(function (event, ui) {
            // set associated global variable
            window.glob[me.data.name] = $(this).prop("checked");
            cl("LogPar clickfunction(): setting glob[" + me.data.name + "] to " + $(this).prop("checked"));
            if (me.data.hasOwnProperty("fun")) {
                if ((typeof me.data.fun) === "string") {
                    cl("LogPar: me.data.fun is string: " + me.data.fun);
                    window[me.data.fun](me);
                } else {
                    cl("LogPar: me.data.fun is no string ....");
                    me.data.fun();
                }
            }
            // redraw the network
            window.nn.draw();
        });
    })
};

//
// table row  "t_max" --> "t_max"_lab
//
// <tr>    
//   <td><label id="t_drawlab" for="t_draw" data-par>t_draw:</label>	<input type="checkbox" id="t_draw"  class="param">	</td>
// </tr>
LogPar.prototype.doTableRow = function () {
    var data = this.data,
    symbol, vchecked;
    // latex symbol
    if (data.hasOwnProperty("sym")) {
        symbol = data.sym;
    } else {
        symbol = data.name;
    }
    // checkbox for "xyz" named "mycb_xyz"

    // generate checked value according to initial value
    if (data.value) {
        vchecked = "checked";
    } else {
        vchecked = "";
    }
    return '<tr>\
    <td colspan="1"><label class="loglabel" title="' + data.rem + '" id="' + data.name + "lab" + '" for="' + this.cbid + '" logLabel>' + symbol + ':</label></td>\
	<td><input title = "' + data.rem + '" type="checkbox" id="' + this.cbid + '" ' + vchecked + '>\
	</td>\
  </tr>';

};

// if name = XXX, we build the following:
// Label with id="XXXlab"
// input with id="XXX"
// slider with id="XXXSlider"
//
function NumPar(data) {
    // name
    // min
    // max
    // step
    // value
    this.data = data;
    this.data.rem = this.data.rem || "";
    NumPar.pars[data.name] = this;
    NumPar.names.push(data.name);
    Par.all[data.name] = "numeric";
    //console.log("setting ",data.name, " to ", +data.value);
    window.glob[data.name] = +data.value;
}

//
//  "t_max" --> "#t_maxSlider"
//
NumPar.prototype.sliderId = function () {
    return this.data.name + "Slider";
};

//
// define jquery ui slider
//
NumPar.prototype.genslider = function () {
    var data = this.data,
        id = this.sliderId();
    //
    // return a function which calls "slider" on #name (name is name of variable)
    //  and sets global variable
    if (ui) {
        return function () {
            $("#" + id).slider({
                range: false,
                min: data.min,
                max: data.max,
                step: data.step,
                /* value: data.value, */
                slide: function (event, ui) {
                    $("#" + data.name).val(ui.value);
                    //console.log("setting window.glob["+data.name+"] to "+ui.value);
                    window.glob[data.name] = ui.value; // GLOBAL!!!!!
                    if (data.hasOwnProperty("fun")) {
                        window[data.fun](event, ui);
                    }
                }
            }).slider("value", data.value);
            // initialize input field
            $("#" + data.name).val($("#" + id).slider("value"));
            // bind keydown to input field
            /*
		   .keydown(function(e) {
			   cl("keydown on spinner");
			   var keyCode = e.keyCode;
			   if (keyCode === 13) {
				   cl("RETURN");
				   //console.dir(e.currentTarget);
				   // trigger change event
				   $( "#"+data.name ).trigger("change");
			   }

			   });
			   */
        };
    } else {
        return function () {};
    }
};

//
// programmatically set this variable and update widget
//
NumPar.prototype.set = function (n) {
    var id = this.sliderId();
    // set slider value
    if (ui) {
        $("#" + id).slider("option", "value", n);
    }
    // set spinbox value
    $("#" + this.data.name).val(n);
    // set global variable
    window.glob[this.data.name] = n;
    if (this.data.hasOwnProperty("fun")) {
        cl("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX calling not: " + this.data.fun);
        window[this.data.fun]({}, {
            value: n
        });
    }
};

//
// define query ui spinner
//
NumPar.prototype.doSpinner = function () {
    var data = this.data; // for closure
    if (ui) {
        return function () {
            $("#" + data.name).spinner({
                min: data.min,
                max: data.max,
                step: data.step,
                value: data.value,
                numberFormat: "n",
                spin: function (event, ui) {
                    // Spinner speak to range slider
                    $("#" + data.name + "Slider").slider("value", ui.value);
                    // set global variable
                    window.glob[data.name] = ui.value;
                    // call funcion if defined
                    if (data.hasOwnProperty("fun")) {
                        window[data.fun](event, ui);
                    }
                },
                change: function (event, ui) {
                    var newval = $("#" + data.name).val();
                    cl("spinner change to " + newval);
                    //console.dir(ui);
                    // Spinner speak to range slider
                    $("#" + data.name + "Slider").slider("value", newval);
                    // set global variable
                    window.glob[data.name] = newval;
                    // call function if defined
                    if (data.hasOwnProperty("fun")) {
                        window[data.fun](event, ui);
                    }
                }
            });
        };
    } else {
        return function () {};
    }
};

//
// table row  "t_max" --> "t_max"_lab
//
// <tr>    
//   <td><label id="t_drawlab" for="t_draw" data-par>t_draw:</label>	<input type="text" id="t_draw"  class="param">	</td>
//   <td><span id="t_drawSlider" slider></span></td>  
// </tr>

//
// returns table row to be inserted by jquery
//
NumPar.prototype.doTableRow = function () {
    var data = this.data;
    var symbol;
    // latex symbol
    if (data.hasOwnProperty("sym")) {
        symbol = data.sym;
    } else {
        symbol = data.name;
    }
    return '<tr>\
    <td><label title = "' + data.rem + '" id="' + data.name + "lab" + '" for="' + data.name + '" data-par>' + symbol + ':</label>\
	<input title = "' + data.rem + '" type="text" id="' + data.name + '"  class="param">\
	</td>\
    <td><span title = "' + data.rem + '" id="' + data.name + "Slider" + '" slider></span></td>\
  </tr>';

};
