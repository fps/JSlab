var jslab_prefix = "";
var jslab_main = document.getElementById("jslab_main");

var jslab_storage = window.localStorage;

var jslab_current_input = null;

function jslab_el_by_id(id) {
    return document.getElementById(id);
}

function jslab_store_inputs() {
    var jslab_count = jslab_main.childElementCount;
    for (var jslab_index = 0; jslab_index <jslab_count ; ++jslab_index) {
        jslab_storage.setItem('jslab_'+jslab_prefix+'_input'+jslab_index, jslab_get_text_input(jslab_main.children[jslab_index]).value);
        console.log("child");
    }
    jslab_storage.setItem('jslab_'+jslab_prefix+'_input_count', jslab_count);
}

function jslab_create_output_element() {
    var o = document.createElement('div');
    // o.classList.add('hidden');
    o.classList.add('output');
    return o;
}

function jslab_get_text_input(jslab_element) {
    return jslab_element.children[0].children[0].children[0];
}

function jslab_get_output_div(jslab_element) {
    return jslab_element.children[1];
}

function save(name) {
    var inputs = [];

    var jslab_count = jslab_main.childElementCount;
    for (var jslab_index = 0; jslab_index <jslab_count ; ++jslab_index) {
        inputs[jslab_index] = jslab_get_text_input(jslab_main.children[jslab_index]).value;
    }
    jslab_storage.setItem(name, JSON.stringify(inputs));

    return "done."
}

function load(name) {
    while (jslab_main.lastChild) {
        jslab_main.removeChild(jslab_main.lastChild);
    }

    inputs = JSON.parse(jslab_storage.getItem(name));

    for (var index = 0; index < inputs.length; ++index) {
        console.log(inputs[index]);
        var new_element = jslab_append_new_iopair(jslab_main, inputs[index]);
        jslab_get_text_input(new_element).onchange();
    }
}

function include(name) {
    console.log("include " + name);
    inputs = JSON.parse(jslab_storage.getItem(name));

    for (var index = 0; index < inputs.length; ++index) {
        console.log(inputs[index]);
        eval(inputs[index]);
    }
}

function jslab_textarea_auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
}

function jslab_create_new_iopair_elements(jslab_parent_node, jslab_text) {
    console.log("jslab_create_new_iopair_element");
    var jslab_iopair_div = document.createElement('div');

    var jslab_input_form = document.createElement('form');
    jslab_input_form.onsubmit = function() { };

    var jslab_input_wrapper_div = document.createElement('div');
    jslab_input_wrapper_div.classList.add('input-wrapper');

    var jslab_text_input = document.createElement('textarea');
    jslab_text_input.rows = 1;
    jslab_text_input.oninput = function() {
        jslab_text_input.style.height = "5px";
        jslab_text_input.style.height = (jslab_text_input.scrollHeight)+"px";
    };

    jslab_text_input.onchange = jslab_text_input.oninput;

    jslab_text_input.classList.add('input-field')
    if (jslab_text) {
        jslab_text_input.value = jslab_text;
    }

    jslab_text_input.setAttribute("placeholder", "input");

    var jslab_input_button_div = document.createElement('div');
    jslab_input_button_div.innerHTML = "☰";
    jslab_input_button_div.classList.add('input-button');

    // This first output div will never be visible. We just keep it around
    // to replace it later, possibly multiple times...
    var jslab_output_div = jslab_create_output_element();
    // o.innerText = "_";

    jslab_iopair_div.appendChild(jslab_input_form);
    jslab_input_form.appendChild(jslab_input_wrapper_div);
    jslab_input_wrapper_div.appendChild(jslab_text_input);
    jslab_input_wrapper_div.appendChild(jslab_input_button_div);
    // jslab_input_form.appendChild(jslab_text_input);

    jslab_iopair_div.appendChild(jslab_output_div);

    return jslab_iopair_div;
}

function jslab_create_new_iopair(jslab_parent_node, jslab_text) {
    console.log("create_new_iopair");

    var jslab_iopair_div = jslab_create_new_iopair_elements(jslab_parent_node, jslab_text);

    var jslab_text_input = jslab_get_text_input(jslab_iopair_div);
    var jslab_output = jslab_get_output_div(jslab_iopair_div);

    jslab_text_input.onfocus = function() {
        Array.from(document.querySelectorAll('.per-input')).forEach(x => x.classList.remove('inactive'));
        Array.from(document.querySelectorAll('.per-input')).forEach(x => x.classList.add('active'));
        // console.log("focus in");
        jslab_current_input = jslab_iopair_div;
    };

    jslab_text_input.onblur = function() {
        Array.from(document.querySelectorAll('.per-input')).forEach(x => x.classList.add('inactive'));
        Array.from(document.querySelectorAll('.per-input')).forEach(x => x.classList.remove('active'));
        // console.log("focus out");
    };

    jslab_text_input.onkeydown = function(event) {
        var key = event.keyCode || event.charCode;

        // BACKSPACE
        if (key == 8) {
            if (this.selectionStart == 0 && this.selectionEnd == 0) {
                console.log("backspace on first char");
                if (jslab_iopair_div.previousSibling) {
                    console.log("focussing the previous sibling...");
                    jslab_get_text_input(jslab_iopair_div.previousSibling).focus();
                    // jslab_get_text_input(jslab_iopair_div.previousSibling).scrollIntoView();
                }

                // Just safeguard against emptying the whole thing
                console.log("parent.childElementCount: " + jslab_parent_node.childElementCount);
                if (jslab_parent_node.childElementCount > 1) {
                    jslab_parent_node.removeChild(jslab_iopair_div);
                }
                return false;
            }
            return true;
        }
        if (key == 13) {
            jslab_store_inputs();

            // textarea support: check if line starts with a whitespace:
            var lines_before_caret = jslab_text_input.value.substr(0, jslab_text_input.selectionStart).split("\n");
            // console.log(lines_before_caret);
            // console.log(lines_before_caret[lines_before_caret.length - 1]);
            var line_before_caret = lines_before_caret[lines_before_caret.length - 1];
            var position = jslab_text_input.selectionStart;
            if (line_before_caret.length > 0 && line_before_caret[0] === ' ') {
                jslab_text_input.value = jslab_text_input.value.slice(0, position) + "\n" + jslab_text_input.value.slice(position);
                jslab_text_input.selectionStart = position + 1;
                jslab_text_input.selectionEnd = position + 1;
                // jslab_text_input.value = jslab_text_input.value + "\n";
                jslab_text_input.onchange();
                return false;
            }

            var jslab_new_output_div = jslab_create_output_element();

            jslab_iopair_div.replaceChild(jslab_new_output_div, jslab_get_output_div(jslab_iopair_div));
            jslab_new_output_div.classList.remove('hidden');

            document.jslab_currentoutput = jslab_new_output_div;

            var jslab_parent_node_len = jslab_parent_node.childElementCount;

            try {
                if (jslab_text_input.selectionStart == 0 && jslab_text_input.selectionEnd == 0) {
                    console.log("appending new iopair (selectionStart and selectionEnd == 0");
                    var jslab_new_input = jslab_create_new_iopair(jslab_main, '');
                    jslab_iopair_div.insertAdjacentElement('beforebegin', jslab_new_input);
                    // jslab_get_text_input(jslab_new_input).focus();
                    return false;
                } else {
                    console.log("input is: " + jslab_text_input.value + " type: " + typeof(jslab_text_input.value));
                    console.log("calling eval(). output follows...");
                    jslab_output = eval.call(null, jslab_text_input.value);

                    console.log(jslab_output);

                    if (jslab_output === null) {
                        console.log("output null...");
                        jslab_output = "null"
                    }

                    if (jslab_output === undefined) {
                        console.log("output undefined...");
                        jslab_output = "undefined"
                    }

                    if (jslab_output.tagName) {
                        // console.log('node!');
                        jslab_iopair_div.replaceChild(jslab_output, jslab_new_output_div)
                    } else {
                        jslab_new_output_div.out = jslab_output;
                        jslab_new_output_div.innerHTML = jslab_output;
                    }
                }
            } catch (error) {
                console.log(error);
                jslab_new_output_div.innerText = error;
                jslab_new_output_div.classList.remove('hidden');
            }
            //

            // If we're on the last input add a new one below...
            var jslab_parent_node_len = jslab_parent_node.childElementCount;

            if (jslab_iopair_div == jslab_parent_node.children[jslab_parent_node_len - 1]) {
                var jslab_next = jslab_append_new_iopair(jslab_parent_node);
            }

            if (jslab_iopair_div.nextSibling != null) {
                jslab_get_text_input(jslab_iopair_div.nextSibling).focus();
                // jslab_get_text_input(jslab_iopair_div.nextSibling).scrollIntoView();
            }

            return false;
        }
    }

    jslab_text_input.focus();
    // jslab_text_input.scrollIntoView();

    return jslab_iopair_div;
}

function jslab_append_new_iopair(jslab_parent_node, jslab_text) {
    console.log("jslab_append_new_iopair");

    var new_element = jslab_create_new_iopair(jslab_parent_node, jslab_text);
    jslab_parent_node.appendChild(new_element);
    // new_element.scrollIntoView();
    return new_element;
}

/* jslab_append_new_iopair(jslab_main); */

function jslab_init(prefix) {
    jslab_prefix = prefix;
    if (jslab_storage.getItem('jslab_'+jslab_prefix+'_input_count') === null) {

       // Create the initial input form that starts it all...
       jslab_input = jslab_append_new_iopair(jslab_main, "");

       // And put some warm welcome message on the screen...
       // jslab_input.children[0].children[0].value = "welcome";
       // jslab_input.children[0].onsubmit();
       // document.forms[0].submit();
    } else {
       var jslab_input_count = parseInt(jslab_storage.getItem('jslab_'+prefix+'_input_count'));

       for (var jslab_count = 0; jslab_count < jslab_input_count; ++jslab_count) {
          console.log('restoring from storage...');
          // console.log(jslab_storage.getItem('input'+jslab_count));

          // var jslab_input = jslab_append_new_input(jslab_main, jslab_storage.getItem('input'+jslab_count));
          var jslab_input = jslab_append_new_iopair(jslab_main, jslab_storage.getItem('jslab_'+prefix+'_input'+jslab_count));
          jslab_get_text_input(jslab_input).onchange();
          // jslab_input.children[0].children[0].value = jslab_storage.getItem('input'+jslab_count);
       }
    }
}

function jslab_share() {
    var lines = [];
    var jslab_input_count = jslab_main.childElementCount;
    for (count = 0; count < jslab_input_count; ++count) {
        lines[count] = jslab_get_text_input(jslab_main.children[count]).value;
    }

    return lines;
}