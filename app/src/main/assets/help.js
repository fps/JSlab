var welcome = 'Welcome to JSLab. Enter <b>help</b> to get started. Enter <b>license</b> for licensing information.';

var license = "GNU GPL v2";

var help = "Enter javascript code and press enter (submit) to evaluate "
+ "it.<br>Enter <b>introduction</b> to get a general introduction.<br>Enter "
+ "<b>topics</b> for a list of help topics.";

var topics = "<ul>"
+ "<li><b>welcome</b> - A welcome message.</li>"
+ "<li><b>help</b> - Help to get started.</li>"
+ "<li><b>introduction</b> - A brief introduction into the JSLab (web)app.</li>"
+ "<li><b>topics</b> - This list.</li>"
+ "<li><b>evaluation</b> - Implementation details about how javascript code is evaluated and how the output is processed.</li>"
+ "<li><b>examples</b> - Some examples to get you started."
+ "<li><b>aliases</b> - Function and variable aliases to make your life easier."
+ "<li><b>reserved</b> - Variable and function names that are used internally. You are free to change their values but stuff might and will break. You have been warned.</li>"
+ "</ul>";

var aliases = "<ul>"
+ "<li>All functions in the Math object are available in the global namespace. Example: <b>sin</b>, <b>cos</b>, ...</li>"
+ "<li>All static properties in the Math object are available in the global namespace with their name converted to lowercase. Examples: <b>pi</b>, <b>e</b>, ...</li>"
+ "</ul>";

var introduction = "JSLab is a simple web page that has a thin android app as "
+ "a wrapper around it. That android app just provides a <b>WebView</b> in which the "
+ "web page is rendered.<br>"
+ "It was born from the desire to have a slightly more capable calculator app "
+ "available and the author then just took the path of least resistance.<br>"
+ "JSLab lets you enter JavaScript code which is then passed to the <b>eval()</b> "
+ "function and the result of the call is presented as output.<br>"
+ "In the end this gives you the whole WebView, an almost complete"
+ "browser, to play around with which is good";

var evaluation = "The code is passed verbatim to eval() and the result is set as innerHTML on "
+ "the output DIV - unless the result has a property tagName (i.e. a DOM node). "
+ "In that case the output DIV is replaced with the result. "
+ "Delete the input and press enter to delete an input/output pair. ";

var examples = "<ul>"
+ "<li>1</li>"
+ "<li>1+1</li>"
+ "<li>sin(0.12) + pow(0.1, 0.1111)</li>"
+ "<li>f = x => 2*x+sin(x)</li>"
+ "<li>f(21)"
+ "<li>" + encode("'<input type=\"range\" id=\"foo\">'") + "</pre></li>";

var reserved = "All identifiers starting with the prefix <b>jslab_</b> are reserved.  "
+ "You are free to change any of them and nothing will stop you from "
+ "doing it, but beware that things will start to break eventually.";
