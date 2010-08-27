module('plugins.DataForms');
function getForm(type, title) {
    if (!type) {
        type = "form";
    }
    if (!title) {
        title = "Test dataForm";
    }
    try {
        var form = document.createElementNS("jabber:x:data", "x");
    } catch (e) {
        var form = document.createElement("x");
        form.setAttribute("xmlns", "jabber:x:data");
    }
    form.setAttribute("type", type);
    var titleNode = document.createElement("title");
    titleNode.textContent = title;
    form.appendChild(titleNode);
    return form;
}

var dataformsPlugin = Strophe._connectionPlugins.dataforms;

test("parse type and title", function() {
         var form = dataformsPlugin.parse(getForm());
         equal(form.type, "form");
         equal(form.title, "Test dataForm");
     });


test("parse another form", function() {
         var form = dataformsPlugin.parse(getForm("result", "Test Form"));
         equal(form.type, "result");
         equal(form.title, "Test Form");
     });

test("parse instructions", function() {
         var form = getForm("result", "Test Form");
         var instructions = document.createElement("instructions");
         instructions.textContent = 'Fill out this form to configure your new bot!';
         form.appendChild(instructions);
         var dataform = dataformsPlugin.parse(form);
         equal(dataform.instructions, "Fill out this form to configure your new bot!");
     });

test("parse fields", function() {
         var form = getForm("result");
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "field");
         form.appendChild(field);
         var dataForm = dataformsPlugin.parse(form);
         equal(dataForm.fields.length, 1);
         equal(dataForm.fields[0].type, "text-single");
     });

test("parse field", function() {
         var field = document.createElement("field");
         field.setAttribute("var", "name-of-field");
         field.setAttribute("type", "text-single");
         var form = new Strophe.Field(field);
         equal(form.variable, "name-of-field");
         equal(form.type, "text-single");
     });

test("parse field without var attribute throw exception", function() {
         expect(1);
        var field = document.createElement("field");
        field.setAttribute("type", "text-single");
        try {
             var form = new Strophe.Field(field);
        } catch (e) {
            equals(e, "must have a var attribute");
        }
     });

test("parse field type fixed without var attribute", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "fixed");
         var form_field = new Strophe.Field(field);
         equals(form_field.type, "fixed");
     });

test("parse label field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         field.setAttribute("label", "hello");
         var form = new Strophe.Field(field);
         equal(form.label, "hello");
     });

test("parse required field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         field.appendChild(document.createElement("required"));
         var form = new Strophe.Field(field);
         ok(form.required);
     });

test("parse non required field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var form = new Strophe.Field(field);
         equal(form.required, false);
     });

test("parse field description", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var desc = document.createElement("desc");
         desc.textContent = "descriptionhasatooltip";
         field.appendChild(desc);
         var form = new Strophe.Field(field);
         equal(form.desc, "descriptionhasatooltip");
     });

test("parse field value", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var value = document.createElement("value");
         value.textContent = "onevalue";
         field.appendChild(value);
         var form = new Strophe.Field(field);
         equal(form.value, "onevalue");
     });

test("parse multiple value", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-multi");
         field.setAttribute("var", "test");
         var value = document.createElement("value");
         value.textContent = "onevalue";
         field.appendChild(value);
         var value2 = document.createElement("value");
         value2.textContent = "onevaluetoo";
         field.appendChild(value2);
         var form = new Strophe.Field(field);
         equal(2, form.values.length);
         equal(form.values[0], "onevalue");
         equal(form.values[1], "onevaluetoo");
     });

test("on parse: multiple value in non multiple value field throw exception", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var value = document.createElement("value");
         value.textContent = "onevalue";
         field.appendChild(value);
         var value2 = document.createElement("value");
         value2.textContent = "onevaluetoo";
         field.appendChild(value2);
         try {
             new Strophe.Field(field);
         } catch (e) {
             equal(e, "cannot have multiple value");
         }
     });

test("on parse option in non list field throw exception", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         field.appendChild(option);
         try {
             new Strophe.Field(field);
         } catch (e) {
             equals(e, "cannot have option");
         }
     });

test("parse list-single", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "list-single");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         field.appendChild(option);
         var form = new Strophe.Field(field);
         equal(form.options.length, 1);
         equal(form.options[0].value, "oneoption");
         equal(form.options[0].label, "oneoption");
     });

test("parse list-multi field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "list-multi");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         option.setAttribute("label", "onelabel");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         field.appendChild(option);
         var option2 = document.createElement("option");
         var value2 = document.createElement("value");
         value2.textContent = "oneoptiontoo";
         option2.appendChild(value2);
         field.appendChild(option2);
         var form = new Strophe.Field(field);
         equal(2, form.options.length);
         equal(form.options[0].value, "oneoption");
         equal(form.options[0].label, "onelabel");
     });

test("parse 2 value in one option throw exception", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "list-multi");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         option.setAttribute("label", "onelabel");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         var value2 = document.createElement("value");
         value2.textContent = "onevalue";
         option.appendChild(value2);
         field.appendChild(option);
         try {
             new Strophe.Field(field);
         } catch (e) {
             equal(e, "must have only one value");
         }
     });


test("media element: uri without type attribute", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("var", "test");
         var media = document.createElementNS(Strophe.NS.DATA_MEDIA, 'media');
         var uri = document.createElement('uri');
         media.appendChild(uri);
         field.appendChild(media);
         try {
            new Strophe.Field(field);
         } catch(e) {
             equal(e, "uri element must have an type attribute");
         }
     });

test("media element: uri without content", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("var", "test");
         var media = document.createElementNS(Strophe.NS.DATA_MEDIA, 'media');
         var uri = document.createElement('uri');
         uri.setAttribute('type', 'audio/ogg');
         media.appendChild(uri);
         field.appendChild(media);
         try {
            new Strophe.Field(field);
         } catch(e) {
             equal(e, "uri element must have a value");
         }
     });

test("media element: uri with type attribute", function() {
         var field = document.createElement("field");
         field.setAttribute("var", "test");
         var media = document.createElementNS(Strophe.NS.DATA_MEDIA, 'media');
         var uri = document.createElement('uri');
         uri.setAttribute('type', 'audio/ogg');
         uri.textContent = "http://victim.example.com/challenges/speech.mp3?F3A6292C";
         media.appendChild(uri);
         field.appendChild(media);
         var form_field = new Strophe.Field(field);
         equal(form_field.media.uri.length, 1);
         equal(form_field.media.uri[0].type, "audio/ogg");
         equal(form_field.media.uri[0].value, "http://victim.example.com/challenges/speech.mp3?F3A6292C");
         equal(form_field.media.height, null);
         equal(form_field.media.width, null);
     });

test("media element: width and height attributes", function() {
         var field = document.createElement("field");
         field.setAttribute("var", "test");
         var media = document.createElementNS(Strophe.NS.DATA_MEDIA, 'media');
         media.setAttribute('height', '200');
         media.setAttribute('width', '42');
         var uri = document.createElement('uri');
         uri.setAttribute('type', 'audio/ogg');
         uri.textContent = "http://victim.example.com/challenges/speech.mp3?F3A6292C";
         var uri2 = document.createElement('uri');
         uri2.setAttribute('type', 'audia/wav');
         uri2.textContent = "http://victim.example.com/challenges/speech.wav?F3A6292C";
         media.appendChild(uri);
         media.appendChild(uri2);
         field.appendChild(media);
         var form_field = new Strophe.Field(field);
         equal(form_field.media.uri.length, 2);
         equal(form_field.media.uri[0].type, "audio/ogg");
         equal(form_field.media.uri[0].value, "http://victim.example.com/challenges/speech.mp3?F3A6292C");
         equal(form_field.media.height, 200);
         equal(form_field.media.width, 42);
     });
