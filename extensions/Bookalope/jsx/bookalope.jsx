
/*
 * By default, ExtendScript has no JSON support and so we add it here.
 * See also:
 *  - https://forums.adobe.com/message/9015663#9015663
 *  - https://github.com/douglascrockford/JSON-js
 */

if(typeof JSON!=='object'){JSON={};}(function(){'use strict';function f(n){return n<10?'0'+n:n;}function this_value(){return this.valueOf();}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};Boolean.prototype.toJSON=this_value;Number.prototype.toJSON=this_value;String.prototype.toJSON=this_value;}var cx,escapable,gap,indent,meta,rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}if(typeof rep==='function'){value=rep.call(holder,key,value);}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}if(typeof JSON.stringify!=='function'){escapable=/[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}return str('',{'':value});};}if(typeof JSON.parse!=='function'){cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}return reviver.call(holder,key,value);}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}throw new SyntaxError('JSON.parse');};}}());


/*
 * Add "beforeClose" event listener which dispatches an event to the other side
 * that the current documents is being closed; data for that event is the number
 * of currently opened documents. The Bookalope panel will then switch to the
 * Upload view when the last document closes.
 */

app.addEventListener("beforeClose", function(event) {
  try {
    var xLib = new ExternalObject("lib:\PlugPlugExternalObject");
    if (xLib) {
      var csEvent = new CSXSEvent();
      csEvent.type = "documentBeforeClose";
      csEvent.data = app.documents.length;
      csEvent.dispatch();
    }
  }
  catch (e) {
    // We do nothing here. Should we alert the user that dispatching a custom
    // event to the other side failed?
  }
}, false);


/**
 * Gather and return configuration information that's useful for the panel.
 *
 * @returns {string} A JSON stringified dictionary of configuration values.
 */

function getConfiguration() {

    // Gather interesting data into a configuration Object, stringify and return it.
    var config = {
        app: {
            version: app.version,
            user: app.userName,
            win: Folder.fs === "Windows"
        },
        fs: {
            data: Folder.userData.fsName,
            desktop: Folder.desktop.fsName,
            tmp: Folder.temp.fsName,
            separator: Folder.fs === "Windows" ? "\\" : "/"
        }
    };
    return JSON.stringify(config);
}


/**
 * Write the given object to the given document's Bookalope data store.
 *
 * @param {Document} doc - The InDesign document whose data store we want to use.
 * @param {Object} data - An object that's stored into the document's data store.
 */

function bookalopeSetDocumentData(doc, data) {

    // Add the data to the document.
    doc.insertLabel("privateBookalopeDataStore", JSON.stringify(data));
}


/**
 * Add the given key:value pair to the given document's Bookalope data store.
 *
 * @param {Document} doc - The InDesign document whose data store we want to use.
 * @param {string) key - The key by which to find the value in the data store.
 * @param {Object} value - A JSON stringify-able object to store.
 */

function bookalopeAddDocumentData(doc, key, value) {

    // Get private Bookalope data stored with the document. If none existed yet,
    // create an empty dictionary. Then add the given key:value to the dictionary,
    // or update the value if the key already existed.
    var data = bookalopeGetDocumentData(doc);
    if (data && data.bookalope) {
        var bookalopeData = data.bookalope;
    }
    else {
        var bookalopeData = {};
    }
    bookalopeData[key] = value;
    bookalopeSetDocumentData(doc, bookalopeData);
}


/**
 * Get information from the given document; if the document contains a Bookalope data
 * store then return that, too.
 *
 * @param {Document} doc - The InDesign document whose data store we want to return.
 * @returns {Object | null}
 */

function bookalopeGetDocumentData(doc) {

    // Safeguard, because this might be called with an invalid document.
    if (doc && doc.isValid) {

        // The document data.
        var data = {
            "doc": {
                "name": doc.name
            },
            "bookalope": null
        };

        // Return the private Bookalope data stored with the document as a dictionary,
        // or null if the document doesn't have any (i.e. is not a document generated
        // by Bookalope).
        var bookalopeData = doc.extractLabel("privateBookalopeDataStore");
        if (bookalopeData.length !== 0) {
            data.bookalope = JSON.parse(bookalopeData);
        }
        return data;
    }
    return null;
}


/**
 * Find the InDesign document based on the given name, and return the document's Bookalope
 * data store, or null if there was none.
 *
 * @param {string} docName - The name of the InDesign Document whose data store we're after.
 * @returns {string} A JSON stringified data store.
 */

function bookalopeGetDocumentDataFromName(docName) {

    // Find the document by its name, and then find and return the document's
    // private Bookalope data encoded to a JSON string.
    var doc = app.documents.itemByName(docName);
    return JSON.stringify(bookalopeGetDocumentData(doc));
}


/**
 * Find the currently active InDesign document, and return the document's Bookalope
 * data store, or null if there was none.
 *
 * @returns {string} A JSON stringified data store.
 */

function bookalopeGetDocumentDataFromActive() {

    // Find the currently active document, and then find and return the document's
    // private Bookalope data encoded to a JSON string.
    var doc = app.documents.length !== 0 ? app.activeDocument : undefined;
    return JSON.stringify(bookalopeGetDocumentData(doc));
}


/**
 * Creates a new InDesign document from an ICML file. The Book ID and Bookflow ID parameters
 * are stored alongside the new document in order to identify the Bookalope flow the document
 * belongs to. Note that the ID parameters are not being validated and are trusted values.
 *
 * See also:
 *  - https://www.adobe.com/content/dam/Adobe/en/devnet/indesign/cs55-docs/IDML/idml-specification.pdf
 *  - https://www.adobe.com/content/dam/Adobe/en/devnet/indesign/cs5_docs/idml/idml-cookbook.pdf
 *
 * @param {string} idmlFileName - The path of an IDML file which is to be loaded into InDesign.
 * @param {string} bookId - A valid Bookalope Book id.
 * @param {string} bookflowId - A valid Bookalope Bookflow id.
 * @param {boolean} betaHost - Booloan flag indicating whether the Book is on beta or production server.
 */

function bookalopeCreateDocument(idmlFileName, bookId, bookflowId, betaHost) {

    // Open the document in default mode, and display it.
    var idmlFile = new File(idmlFileName);
    var bookalopeDocument = app.open(idmlFile);

    // Bookalope keeps some private data alongside the document.
    bookalopeSetDocumentData(bookalopeDocument, {
        "book-id": bookId,
        "bookflow-id": bookflowId,
        "beta": betaHost
    });
}


/**
 * Check that the given document can be exported to Bookalope: it must be valid, it
 * must have been saved, and all of its links must be valid. Alerts the user if not.
 *
 * @param {Document} doc - The InDesign document to check.
 * @returns {bool} True if the document can be exported, false otherwise.
 */

function bookalopeCheckDocument(doc) {

    // Check that we work with a valid document.
    if (!doc || !doc.isValid) {
        alert("Unable to export an invalid document to Bookalope");
        return false;
    }

    // When we export the document we want to make sure that the original active
    // document and its resources have also been saved.
    if (!doc.saved || doc.modified) {
        alert("Please save this document before exporting it to Bookalope");
        return false;
    }

    // Make sure that all links in the document are valid.
    for (var i = 0; i < doc.links.length; i++) {
        var link = doc.links.item(i);
        if (link.status === LinkStatus.LINK_INACCESSIBLE || link.status === LinkStatus.LINK_MISSING || link.status === LinkStatus.LINK_OUT_OF_DATE) {
            alert("Please check the links in this document: some are not up-to-date or are missing");
            return false;
        }
    }
    return true;
}


/**
 * Create a temporary copy of the given document and open it without a window.
 * It looks like
 *
 *     var tmpFile = new File(app.createTemporaryCopy(doc.fullName));
 *
 * doesn't work on Windows because `createTemporaryCopy()` doesn't actually create
 * a temporary copy, so we take the manual approach here. See also this Slack
 * conversation: https://adobedevs.slack.com/archives/C1FKLQ63F/p1635906342026700
 *
 * @param {Document} doc - The saved InDesign document to copy.
 * @returns {Document|null} The opened temporary document, or null if an error occurred.
 */

function bookalopeOpenTemporaryCopy(doc) {

    var docFile = doc.fullName;
    var tmpFileName = Folder.temp + "/" + docFile.name;
    if (!docFile.copy(tmpFileName)) {
        alert("Unable to create a temporary copy of the document");
        return null;
    }
    return app.open(new File(tmpFileName), false);
}


/**
 * Generate a unique filename.
 *
 * @param {string} base - The path and base name of the filename.
 * @param {string} ext - The filename extension, including dot.
 * @return {string} The unique path and filename.
 */

function bookalopeCreateUniqueName(base, ext) {
    for (var i = 0; new File(base + ext).exists; i++) {
        base = base.replace(/_\d+$/, "") + "_" + String(i);
    }
    return base + ext;
}


/**
 * Create an RTF file from the document with the given name, and save that to the given path.
 *
 * @param {string} docName - Name of the document for which the RTF is created.
 * @returns {string,bool} False if an error occurred, otherwise the complete path to the RTF file.
 */

function bookalopeDocumentByNameToRTF(docName) {

    var doc = app.documents.itemByName(docName);
    try {
        return bookalopeDocumentToRTF(doc);
    } catch (exc) {
        alert("Failed to export document: " + exc);
        return JSON.stringify(false);
    }
}


/**
 * Create an RTF file from the currently active document, and save that to the given path.
 *
 * @returns {string,bool} False if an error occurred, otherwise the complete path to the RTF file.
 */

function bookalopeActiveDocumentToRTF() {

    var doc = app.documents.length !== 0 ? app.activeDocument : undefined;
    try {
        return bookalopeDocumentToRTF(doc);
    } catch (exc) {
        alert("Failed to export document: " + exc);
        return JSON.stringify(false);
    }
}


/**
 * Create an RTF file from the given document, and save that to the given path.
 *
 * @param {Document} doc - The InDesign document for which the RTF is created.
 * @returns {string,bool} False if an error occurred, otherwise the complete path to the RTF file.
 */

function bookalopeDocumentToRTF(doc) {

    // Check that the document is valid, saved, and that its links are fine.
    if (!bookalopeCheckDocument(doc)) {
        return JSON.stringify(false);
    }

    // A polyfill of Array.prototype.includes, although this may not be
    // necessary at some point for new versions of InDesign anymore.
    if (!Array.prototype.includes) {
        Array.prototype.includes = function(item) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === item) {
                    return true;
                }
            }
            return false;
        };
    }

    var createUniqueName = bookalopeCreateUniqueName;

    /**
     * Given a text frame and an image, duplicate image near to the text
     * frame for export.
     *
     * @param {TextFram} textFrame - Target text frame where to anchor the image.
     * @param {Rectangle} imageRect - The image that's duplicated and anchored.
     * @return {Rectangle} The anchored new image.
     */
    function anchorImage(textFrame, imageRect) {

        // Create an anchor in the given text frame for the image.
        var insertionPoint = textFrame.insertionPoints[0];
        var anchor = insertionPoint.rectangles.add();
        anchor.contentType = ContentType.graphicType;

        // Recompose the parent story so that the geometricBounds make sense.
        insertionPoint.parentStory.recompose();

        // Save the user's measurement preferences, and then switch to points unit.
        var userHoriz = tmpDoc.viewPreferences.horizontalMeasurementUnits;
        var userVert = tmpDoc.viewPreferences.verticalMeasurementUnits;
        tmpDoc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.points;
        tmpDoc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.points;

        // Configure the custom anchor.
        var anchorProps = tmpDoc.anchoredObjectDefaults.properties;
        anchor.applyObjectStyle(anchorProps.anchoredObjectStyle);
        if (anchorProps.anchorContent == ContentType.textType) {
            try {
                anchor.parentStory.appliedParagraphStyle = anchorProps.anchoredParagraphStyle;
            } catch (_) {
                // Might be null, and we do nothing in that case.
            }
        }
        anchor.anchoredObjectSettings.properties = doc.anchoredObjectSettings.properties;
        anchor.anchoredObjectSettings.anchoredPosition = AnchorPosition.anchored;
        anchor.anchoredObjectSettings.pinPosition = false;

        // Get the geometric boundaries for both objects.
        var frameBounds = textFrame.geometricBounds;
        var imageBounds = imageRect.geometricBounds;

        // Copy image into the anchored frame and resize its bounds.
        var image = imageRect.images[0];
        var imagePath = image.itemLink.filePath;
        anchor.place(new File(imagePath));
        anchor.geometricBounds = [
            imageBounds[0] - frameBounds[0],
            imageBounds[1] - frameBounds[1],
            imageBounds[2] - frameBounds[0],
            imageBounds[3] - frameBounds[1]
        ];

        // Then resize the image itself.
        var newImageBoundY = anchor.geometricBounds[0] - (imageBounds[0] - imageBounds[0]);
        var newImageBoundX = anchor.geometricBounds[1] - (imageBounds[1] - imageBounds[1]);
        anchor.images[0].geometricBounds = [
            newImageBoundY,
            newImageBoundX,
            newImageBoundY + (image.geometricBounds[2] - image.geometricBounds[0]),
            newImageBoundX + (image.geometricBounds[3] - image.geometricBounds[1])
        ];

        // Adjust the textWrapPreferences for the anchored image.
        anchor.textWrapPreferences.textWrapMode = imageRect.textWrapPreferences.textWrapMode;
        anchor.textWrapPreferences.textWrapOffset = imageRect.textWrapPreferences.textWrapOffset;
    }

    /**
     * Write the given Image object to disk using the given path and file name.
     *
     * @param {Graphic} graphic - The Graphic object to export.
     * @param {File} file - The File object represents a local host file.
     */
    function exportPNG(graphic, file) {
        try {
            var other = graphic.duplicate();
            try {
                // FIXME Where's images documented?
                // https://www.indesignjs.de/extendscriptAPI/indesign-latest/#Graphic.html
                other.images[0].clearTransformations();
                other.images[0].fit(FitOptions.FRAME_TO_CONTENT);
            } catch (_) {
                // Ignore any problem and try to export the image anyway.
            }
            other.exportFile(ExportFormat.PNG_FORMAT, file);
            other.remove();
        } catch (_) {
            // Notify caller/user that exporting the image failed:
            // https://github.com/bookalope/InDesign-CEP/pull/13#issuecomment-938668459
        }
    }

    /**
     * Compare the locations of two text frames based on their respective geometric
     * boundaries (which have the format [y1, x1, y2, x2]). Returns -1 if frameA
     * is above or left of frameB (i.e. is "smaller"); returns 1 otherwise.
     *
     * @param {TextFrame} frameA - A TextFrame object reference.
     * @param {TextFrame} frameB - A TextFrame object reference.
     * @return {Number} -1 if frameA is smaller than frameB, 1 otherwise.
     */
    function cmpFrames(frameA, frameB) {
        if (frameA.geometricBounds[0] < frameB.geometricBounds[0]) {
            return -1;
        }
        if (frameA.geometricBounds[0] == frameB.geometricBounds[0]) {
            return (frameA.geometricBounds[1] < frameB.geometricBounds[1]) ? -1 : 1;
        }
        return 1;
    }

    // Create and open a temporary copy of the document that we want to export.
    var tmpPath = Folder.temp;
    var tmpDoc = bookalopeOpenTemporaryCopy(doc);
    if (!tmpDoc) {
        return JSON.stringify(false);
    }

    // Open a progress bar window, where max progress is defined by the 8 steps
    // (i.e. progress 0 through 7) for this RTF conversion. Then, times 100 because
    // we'll track progress per step in percent, too. Note that `pbarInc` can become
    // `Infinity` if the number of processed items (e.g. pages.length) is zero. In
    // that case it won't matter because `pbarInc` isn't used.
    var progressWin = new Window("palette", "Preparing document for Bookalope...");
    progressWin.pbar = progressWin.add("progressbar", undefined, 0, 7 * 100);
    progressWin.pbar.preferredSize.width = 300;
    progressWin.pbar.value = 0;
    progressWin.show();
    var pbarVal, pbarInc;  // To update the progress bar during each step.

    // Step 1: unlock all layers and elements in the document.
    tmpDoc.layers.everyItem().locked = false;
    tmpDoc.pageItems.everyItem().locked = false;
    progressWin.pbar.value = pbarVal = 100;

    // Step 2: add a character style for page numbers that we'll inject
    // into the text further down. Bookalope will know what to do with
    // that extra goodness.
    var pgnrCharacterStyleName = "bookalope-page-number";
    var pgnrCharacterStyle = tmpDoc.characterStyles.itemByName(pgnrCharacterStyleName);
    if (!pgnrCharacterStyle.isValid) {
        pgnrCharacterStyle = tmpDoc.characterStyles.add({
            name: pgnrCharacterStyleName,
            pointSize: 0.1
        });
    }
    progressWin.pbar.value = pbarVal = 200;

    // Step 3: insert into the text and where the text flow breaks onto the
    // next page and using our special character style the page name of the
    // current page.
    pbarInc = (1 / tmpDoc.pages.length) * 100;
    for (var i = 0; i < tmpDoc.pages.length; i++) {
        var pageTextFrames = [];
        var page = tmpDoc.pages[i];
        var textFrames = page.textFrames;
        for (var j = 0; j < textFrames.length; j++) {
            var textFrame = textFrames[j];
            if (textFrame.parent.constructor.name === "Spread") {
                if (textFrame.contents !== "" && (textFrame.nextTextFrame || textFrame.previousTextFrame)) {
                    pageTextFrames.push(textFrame);
                }
            }
        }
        if (pageTextFrames.length !== 0) {
            pageTextFrames.sort(cmpFrames);
            var textFrame = pageTextFrames[0];
            var insertionPoint = textFrame.insertionPoints.item(0);
            insertionPoint.contents = "" + page.name;
            insertionPoint.applyCharacterStyle(pgnrCharacterStyle, true);
        }
        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    progressWin.pbar.value = pbarVal = 300;

    // Step 4: delete empty graphics, and then export the embedded images.
    var docGraphics = tmpDoc.allGraphics;
    var emptyGraphics = [];
    pbarInc = (1 / docGraphics.length) * 100 * (1/3);
    for (var i = 0; i < docGraphics.length; i++) {
        var graphic = docGraphics[i];
        try {
            var area = (graphic.visibleBounds[2] - graphic.visibleBounds[0]) * (graphic.visibleBounds[3] - graphic.visibleBounds[1]);
            if (area === 0) {
                emptyGraphics.push(graphic);
            }
        } catch(_) {
            emptyGraphics.push(graphic);
        }
        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    pbarInc = (1 / emptyGraphics.length) * 100 * (1/3);
    for (var i = 0; i < emptyGraphics.length; i++) {
        emptyGraphics[i].remove();

        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    docGraphics = tmpDoc.allGraphics;
    pbarInc = (1 / docGraphics.length) * 100 * (1/3);
    for (var i = 0; i < docGraphics.length; i++) {
        var graphic = docGraphics[i];
        if (graphic.itemLink == null) {
            var tmpImgFile = new File(createUniqueName(tmpPath + "/img", ".png"));
            exportPNG(graphic, tmpImgFile);
            graphic.parent.place(tmpImgFile);
        } else if (graphic.itemLink.status === LinkStatus.linkEmbedded) {
            app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
            graphic.itemLink.unembed(tmpPath);
            app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
        } else {
            // Ignore other link statuses:
            // https://github.com/bookalope/InDesign-CEP/pull/13#issuecomment-938669971
        }
        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    progressWin.pbar.value = pbarVal = 400;

    // Step 5: anchor images on document pages.
    pbarInc = (1 / tmpDoc.pages.length) * 100;
    for (var i = 0; i < tmpDoc.pages.length; i++) {
        var page = tmpDoc.pages.item(i);
        if (page.textFrames.length >= 1) {
            // Each image must be anchored in order to be exported correctly to RTF,
            // so we anchor them to the first text box on the page. We can tell the
            // user that if they have unexpected results (images anchored in incorrect
            // places) they can anchor images manually before running the script.
            var textFrame = page.textFrames.item(0);
            if (page.rectangles.length >= 1) {
                for (var j = 0; j < page.rectangles.length; j++) {
                    var imageRect = page.rectangles[j];
                    if (imageRect.images.length >= 1) {
                        anchorImage(textFrame, imageRect);
                    }
                }
            }
        }
        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    progressWin.pbar.value = pbarVal = 500;

    // Step 6: order stories so we can export them in sequence. So we loop over all pages,
    // and over all frames on a single page, and order the frames.
    var stories = [];
    var storiesId = [];
    pbarInc = (1 / tmpDoc.pages.length) * 100;
    for (var i = 0; i < tmpDoc.pages.length; i++) {
        var page = tmpDoc.pages.item(i);
        var frames = [];
        for (var j = 0; j < page.textFrames.length; j++) {
            frames.push(page.textFrames.item(j));
        }
        frames.sort(cmpFrames);

        // For each frame, if its story is not already in the ordered list, we add it.
        for (var j = 0; j < frames.length; j++) {
            var frame = frames[j];
            var story = frame.parentStory;
            var storyId = story.id;
            if (!storiesId.includes(storyId)) {
                stories.push(story);
                storiesId.push(storyId);
            }
        }
        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    progressWin.pbar.value = pbarVal = 600;

    // Step 7: create a new story where we copy-paste all contents in the correct order.
    var newContent = tmpDoc.textFrames.add();
    pbarInc = (1 / stories.length) * 100;
    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        story.duplicate(LocationOptions.AT_END, newContent.parentStory);
        newContent.parentStory.insertionPoints[-1].contents = SpecialCharacters.FRAME_BREAK;

        pbarVal += pbarInc;
        progressWin.pbar.value = Math.round(pbarVal);
    }
    var rtfFile = new File(createUniqueName(tmpPath + "/bookalope-document", ".rtf"));
    newContent.parentStory.exportFile(ExportFormat.RTF, rtfFile);
    progressWin.pbar.value = pbarVal = 700;

    // Step 8: close the active & temporary document and the progress window, and return.
    tmpDoc.close(SaveOptions.NO);
    progressWin.hide();  // Dispose of the window?
    return JSON.stringify(rtfFile.fsName);
}


/**
 * A small log of the last EPUB export, written to Folder.temp/bookalope-export.log.
 * It's never shown to the user, but helps understanding what the export did.
 */

var bookalopeLogFile = new File(Folder.temp + "/bookalope-export.log");


/**
 * Start a new, empty export log.
 */

function bookalopeLogStart() {
    bookalopeLogFile.encoding = "UTF-8";
    bookalopeLogFile.lineFeed = "Unix";
    if (bookalopeLogFile.open("w")) {
        bookalopeLogFile.writeln("Bookalope export log, " + new Date().toString());
        bookalopeLogFile.close();
    }
}


/**
 * Append the given message to the export log, and to the ExtendScript console.
 *
 * @param {string} message - The message to log.
 */

function bookalopeLog(message) {
    $.writeln("Bookalope: " + message);
    bookalopeLogFile.encoding = "UTF-8";
    bookalopeLogFile.lineFeed = "Unix";
    if (bookalopeLogFile.open("a")) {
        bookalopeLogFile.writeln(message);
        bookalopeLogFile.close();
    }
}


/**
 * Return a "signature" of the text layout of the given spread: the text of all text
 * frames on that spread, without anchored object markers. If the signature of a spread
 * doesn't change, then no text moved onto or off the spread.
 *
 * @param {Spread} spread - The InDesign spread.
 * @returns {string} The spread's text layout signature.
 */

function bookalopeSpreadTextSignature(spread) {

    var textFrames = spread.textFrames.everyItem().getElements();
    textFrames.sort(function (a, b) { return a.id - b.id; });
    var text = [];
    for (var i = 0; i < textFrames.length; i++) {
        text.push(textFrames[i].texts.item(0).contents.split(String.fromCharCode(0xFFFC)).join(""));
    }
    return text.join("\u0000");
}


/**
 * Return a "signature" of the text layout of the whole document, i.e. the signatures
 * of all its spreads. If it doesn't change, then no text moved to another page.
 *
 * @param {Document} doc - The InDesign document.
 * @returns {string} The document's text layout signature.
 */

function bookalopeDocumentTextSignature(doc) {

    var text = [];
    for (var i = 0; i < doc.spreads.length; i++) {
        text.push(bookalopeSpreadTextSignature(doc.spreads.item(i)));
    }
    return text.join("\u0001");
}


/**
 * Turn every image frame which sits loosely on a page into a custom anchored object,
 * so that the EPUB export places the image in the text flow. The image frame itself
 * is anchored (not a copy of it) and then moved back to its original position, so
 * that its text wrap stays the same and the text does not reflow; that's important
 * because the EPUB's page list must match the printed pages.
 *
 * The anchor is placed in the text frame on the same page that is closest to the
 * image, at the beginning of the last line above the image (text wrap of an anchored
 * object only affects the lines following its anchor).
 *
 * If anchoring an image moves any text on its spread, or the image can't be moved
 * back to its original position, then the image is released again and left where
 * it was: the page list is more important than the image's position in the text.
 * This happens silently, the reasons are only written to the export log.
 *
 * Releasing an image doesn't always restore the text exactly. If that happens, we
 * stop and return the image's id as `broken`: the document's layout can't be trusted
 * anymore, and the caller should start over with a fresh copy, skipping that image.
 *
 * @param {Document} doc - The InDesign document whose images are anchored.
 * @param {Object} skipIds - The ids of images not to anchor, as keys.
 * @returns {Object} The number of `anchored` and `skipped` images, and the id of the
 *     image whose release `broke` the layout, or null.
 */

function bookalopeAnchorImages(doc, skipIds) {

    // Work in points; we never save this (temporary) document, so we don't restore.
    doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
    doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;

    /**
     * Return the distance between two bounds [y1, x1, y2, x2], zero if they overlap.
     */
    function distance(a, b) {
        var dy = Math.max(0, a[0] - b[2], b[0] - a[2]);
        var dx = Math.max(0, a[1] - b[3], b[1] - a[3]);
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Return true if the two bounds are the same, give or take half a point.
     */
    function sameBounds(a, b) {
        return Math.abs(a[0] - b[0]) <= 0.5 && Math.abs(a[1] - b[1]) <= 0.5;
    }

    /**
     * Return the first insertion point of the given frame's story among the given
     * text frames (which must include the frame itself).
     */
    function storyStartIn(frame, textFrames) {
        var start = frame.insertionPoints.item(0);
        for (var k = 0; k < textFrames.length; k++) {
            if (textFrames[k].parentStory.id === frame.parentStory.id && textFrames[k].insertionPoints.item(0).index < start.index) {
                start = textFrames[k].insertionPoints.item(0);
            }
        }
        return start;
    }

    /**
     * Describe where two text signatures differ, for the log.
     */
    function describeDifference(before, after) {
        var i = 0;
        while (i < before.length && i < after.length && before.charAt(i) === after.charAt(i)) {
            i++;
        }
        function excerpt(text) {
            return text.substr(Math.max(0, i - 30), 60).replace(/\u0000/g, " | ").replace(/[\r\n]/g, " / ");
        }
        return "text differs at character " + i + ", before: \"" + excerpt(before) + "\", after: \"" + excerpt(after) + "\"";
    }

    /**
     * Anchor the given image frame at the given insertion point, then move it back to
     * its original bounds. If the image or any text on its spread moved, release the
     * image again and return the reason; return undefined on success.
     */
    function tryAnchor(rect, bounds, frame, insertionPoint) {
        restoreFailed = false;
        var spread = rect.parent;
        var signature = bookalopeSpreadTextSignature(spread);
        var anchored = false;
        var reason;
        try {
            rect.anchoredObjectSettings.insertAnchoredObject(insertionPoint, AnchorPosition.ANCHORED);
            anchored = true;
            rect.anchoredObjectSettings.pinPosition = false;
            frame.parentStory.recompose();
            rect.move([bounds[1], bounds[0]]);
            frame.parentStory.recompose();
            if (!sameBounds(rect.geometricBounds, bounds)) {
                reason = "image could not be moved back to its position";
            } else {
                var newSignature = bookalopeSpreadTextSignature(spread);
                if (newSignature !== signature) {
                    reason = "anchoring moved text (" + describeDifference(signature, newSignature) + ")";
                }
            }
        } catch (exc) {
            reason = String(exc);
        }
        if (!reason) {
            return undefined;
        }

        // Something went wrong, so release the image and restore its position.
        try {
            if (anchored) {
                rect.anchoredObjectSettings.releaseAnchoredObject();
            }
            rect.move([bounds[1], bounds[0]]);
            frame.parentStory.recompose();
            if (!sameBounds(rect.geometricBounds, bounds)) {
                reason += "; and the image is not back at its position";
                restoreFailed = true;
            }
            if (bookalopeSpreadTextSignature(rect.parent) !== signature) {
                reason += "; and the text was not restored";
                restoreFailed = true;
            }
        } catch (exc) {
            reason += "; and restoring the image failed: " + exc;
            restoreFailed = true;
        }
        return reason;
    }

    var restoreFailed = false;
    var anchoredCount = 0;
    var skipped = 0;
    for (var i = 0; i < doc.pages.length; i++) {
        var page = doc.pages.item(i);

        // Collect the image frames and the non-empty text frames which sit directly
        // on the page's spread, i.e. which are not anchored or grouped already.
        var images = [];
        var rectangles = page.rectangles.everyItem().getElements();
        for (var j = 0; j < rectangles.length; j++) {
            if (rectangles[j].parent.constructor.name === "Spread" && rectangles[j].images.length !== 0) {
                images.push(rectangles[j]);
            }
        }
        var frames = [];
        var textFrames = page.textFrames.everyItem().getElements();
        for (var j = 0; j < textFrames.length; j++) {
            if (textFrames[j].parent.constructor.name === "Spread" && textFrames[j].lines.length !== 0) {
                frames.push(textFrames[j]);
            }
        }
        if (images.length === 0 || frames.length === 0) {
            continue;
        }

        for (var j = 0; j < images.length; j++) {
            var rect = images[j];
            var bounds = rect.geometricBounds;
            if (skipIds[rect.id]) {
                bookalopeLog("Page " + page.name + ": image " + rect.id + " skipped");
                skipped++;
                continue;
            }

            // Find the closest text frame, and in it the last line above the image.
            var frame = frames[0];
            for (var k = 1; k < frames.length; k++) {
                if (distance(frames[k].geometricBounds, bounds) < distance(frame.geometricBounds, bounds)) {
                    frame = frames[k];
                }
            }
            var line = frame.lines.item(0);
            for (var k = 1; k < frame.lines.length; k++) {
                if (frame.lines.item(k).baseline >= bounds[0]) {
                    break;
                }
                line = frame.lines.item(k);
            }

            // Find the start of the closest frame's story on this page: the first
            // insertion point of the story's frames there.
            var storyStart = storyStartIn(frame, frames);

            // Try to anchor the image at the line above it, which places it best in
            // the text flow. The image's text wrap then only affects the lines after
            // the anchor, so if that moves text, try at the start of the text frame
            // and then at the start of the story on this page, where more (or all) of
            // the page's lines follow the anchor and are wrapped like before.
            var candidates = [
                ["line above image", line.insertionPoints.item(0)],
                ["start of text frame", frame.insertionPoints.item(0)],
                ["start of story on page", storyStart]
            ];
            var where = [];
            var seen = {};
            for (var k = 0; k < candidates.length; k++) {
                var index = candidates[k][1].index;
                if (!seen[index]) {
                    seen[index] = true;
                    where.push(candidates[k]);
                }
            }
            var done = false;
            for (var k = 0; k < where.length && !done; k++) {
                var reason = tryAnchor(rect, bounds, frame, where[k][1]);
                if (reason) {
                    bookalopeLog("Page " + page.name + ": image " + rect.id + " not anchored at " + where[k][0] + ": " + reason);
                    if (restoreFailed) {
                        return {anchored: anchoredCount, skipped: skipped + 1, broken: rect.id};
                    }
                } else {
                    bookalopeLog("Page " + page.name + ": image " + rect.id + " anchored at " + where[k][0]);
                    done = true;
                }
            }
            if (done) {
                anchoredCount++;
            } else {
                skipped++;
            }
        }
    }
    bookalopeLog("Images anchored: " + anchoredCount + ", left unanchored: " + skipped);
    return {anchored: anchoredCount, skipped: skipped, broken: null};
}


/**
 * Create an EPUB file from the currently active document, and save that to a temporary path.
 *
 * @returns {string,bool} False if an error occurred, otherwise the complete path to the EPUB file.
 */

function bookalopeActiveDocumentToEPUB() {

    var doc = app.documents.length !== 0 ? app.activeDocument : undefined;
    try {
        return bookalopeDocumentToEPUB(doc);
    } catch (exc) {
        alert("Failed to export document: " + exc);
        return JSON.stringify(false);
    }
}


/**
 * Create a reflowable EPUB 3 file from the given document, and save that to a temporary
 * path. The export works on a temporary copy of the document, so the original document
 * and its EPUB export preferences remain untouched.
 *
 * @param {Document} doc - The InDesign document for which the EPUB is created.
 * @returns {string,bool} False if an error occurred, otherwise the complete path to the EPUB file.
 */

function bookalopeDocumentToEPUB(doc) {

    // Check that the document is valid, saved, and that its links are fine.
    if (!bookalopeCheckDocument(doc)) {
        return JSON.stringify(false);
    }

    // Create and open a temporary copy of the document that we want to export.
    bookalopeLogStart();
    bookalopeLog("Document: " + doc.fullName.fsName);
    var tmpDoc = bookalopeOpenTemporaryCopy(doc);
    if (!tmpDoc) {
        return JSON.stringify(false);
    }

    // Open a progress bar window with four steps: unlock, anchor, export, close.
    var progressWin = new Window("palette", "Preparing document for Bookalope...");
    progressWin.pbar = progressWin.add("progressbar", undefined, 0, 4);
    progressWin.pbar.preferredSize.width = 300;
    progressWin.pbar.value = 0;
    progressWin.show();

    var userInteractionLevel = app.scriptPreferences.userInteractionLevel;
    var epubFile = new File(bookalopeCreateUniqueName(Folder.temp + "/bookalope-document", ".epub"));
    try {

        // Steps 1 and 2: unlock all layers and elements in the document, then anchor
        // the images into the text flow where that's possible without moving any text
        // (the EPUB's page list must match the printed book). If anchoring broke the
        // layout anyway, start over with a fresh copy and skip the culprit image; as a
        // last resort, export without anchoring any images at all.
        var skipIds = {};
        var anchorImages = true;
        for (var attempt = 1; ; attempt++) {
            tmpDoc.layers.everyItem().locked = false;
            tmpDoc.pageItems.everyItem().locked = false;
            progressWin.pbar.value = 1;
            if (!anchorImages) {
                break;
            }
            var signature = bookalopeDocumentTextSignature(tmpDoc);
            var result = bookalopeAnchorImages(tmpDoc, skipIds);
            if (!result.broken && bookalopeDocumentTextSignature(tmpDoc) === signature) {
                break;
            }
            if (result.broken && attempt < 5) {
                bookalopeLog("Layout changed, starting over without image " + result.broken);
                skipIds[result.broken] = true;
            } else {
                bookalopeLog("Layout changed, starting over without anchoring images");
                anchorImages = false;
            }
            tmpDoc.close(SaveOptions.NO);
            tmpDoc = bookalopeOpenTemporaryCopy(doc);
            if (!tmpDoc) {
                throw new Error("Unable to reopen the temporary copy of the document");
            }
        }
        progressWin.pbar.value = 2;

        // Step 3: configure and export a reflowable EPUB. The preferences are stored
        // with the (temporary) document, so we set all of them explicitly instead of
        // inheriting whatever the user configured for their own EPUB exports.
        var prefs = tmpDoc.epubExportPreferences;
        prefs.version = EpubVersion.EPUB3;
        prefs.exportOrder = ExportOrder.LAYOUT_ORDER;
        prefs.breakDocument = false;
        prefs.bulletExportOption = BulletListExportOption.UNORDERED_LIST;
        prefs.numberedListExportOption = NumberedListExportOption.ORDERED_LIST;
        prefs.embedFont = true;
        prefs.epubCover = EpubCover.NONE;
        prefs.footnotePlacement = EPubFootnotePlacement.FOOTNOTE_INSIDE_POPUP;
        prefs.generateCascadeStyleSheet = true;
        prefs.includeClassesInHTML = true;
        prefs.javascripts = [];
        prefs.preserveLocalOverride = true;
        prefs.stripSoftReturn = false;
        prefs.epubCreatePageNavigation = true;
        prefs.useExistingImageOnExport = true;

        // Suppress export warnings (e.g. overset text) which would block the script.
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
        tmpDoc.exportFile(ExportFormat.EPUB, epubFile, false);
        progressWin.pbar.value = 3;
    } finally {

        // Step 4: restore the user's settings, close the temporary document and the
        // progress window, even if the export failed.
        app.scriptPreferences.userInteractionLevel = userInteractionLevel;
        if (tmpDoc && tmpDoc.isValid) {
            tmpDoc.close(SaveOptions.NO);
        }
        progressWin.pbar.value = 4;
        progressWin.close();
    }

    if (!epubFile.exists) {
        bookalopeLog("EPUB export failed");
        alert("Failed to export the document to EPUB");
        return JSON.stringify(false);
    }
    bookalopeLog("EPUB: " + epubFile.fsName);
    return JSON.stringify(epubFile.fsName);
}
