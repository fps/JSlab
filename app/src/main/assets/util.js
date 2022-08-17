function encode(e) {
    return e.replace(/[^]/g,function(e){return"&#"+e.charCodeAt(0)+";"})
};

