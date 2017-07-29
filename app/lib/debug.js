if (!da.outputLog) {
    da.outputLog = function (message) {
        console.log.apply(console, [message])
    };
}


function outputLog() {
    var scripts = document.getElementsByTagName("script");
    var script = scripts[scripts.length-1].src

    if (da.outputLog) {
        var str = "";
        for (var x=0; x<arguments.length; x++) {
            var argument = arguments[x];
            if (typeof(argument) == "object") {
                str += JSON.stringify(argument);
            }
            else {
                str += argument+"";
            }
        }
        da.outputLog("["+script+"]"+str);
    }
    else {
        console.log(arguments);
    }
}
