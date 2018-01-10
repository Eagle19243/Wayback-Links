// toggle to show the "powered by wayback links" footer
// var WLshowFooter = true;

// add urls that should be excluded from wayback links.
// accepts full urls or valid regular expression patterns of urls.
var WLuriPatternsToExclude = [
    "https?://dx.doi.org*",
    "https?://doi.org*"
];

// Determining what is a URL. In this case, either a relative path or a HTTP/HTTPS scheme.
var WLhasHTTPRegexp = /^https?:/;
var WLhasColonRegexp = /:/;
function WLIsURL(href) {
    return Boolean(href) && (WLhasHTTPRegexp.test(href) || !WLhasColonRegexp.test(href));
}

// Contains URIs of web archives that should be excluded from wayback links.
// This list includes base URIs of web archives that rewrite memento urls.
// If unsure, do not edit.
var WLWebArchiveBaseUriToExclude = [
    "https?://webarchive.nationalarchives.gov.uk/*",
    "https?://web.archive.org/*"
];

// schema.org attributes to support
var WLSchemaOrgAttributes = {
    "date-published": "Get near page creation date ",
    "date-modified": "Get near page modified date "
}

// Helper function to provide indexOf for Internet Explorer
if (!Array.prototype.indexOf) {
   Array.prototype.indexOf = function(item) {
      var i = this.length;
      while (i--) {
         if (this[i] === item) return i;
      }
      return -1;
   }
}

// Creates a pseudorandom unique ID
// from https://gist.github.com/gordonbrander/2230317
var WL_ID = function () {
  return 'WL_' + Math.random().toString(36).substr(2, 9);
};

// Appends creates a list-item link to `uri` with `text` and appends it to `parent`
function WL_appendHiddenLink(parent, text, uri) {
    var listItem = document.createElement('li');
    var linkItem = document.createElement('div');
    var listLink = document.createElement('a');
    listLink.setAttribute('class', 'waybackLinks WLItem');
    listLink.href = uri;
    listLink.innerHTML = text;

    linkItem.appendChild(listLink);
    listItem.appendChild(linkItem);
    parent.appendChild(listItem);
}

// Adds leading '0' to numbers
// From http://www.w3schools.com/jsref/jsref_gethours.asp
function WLAddZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

// Formats the dateStr in the aggregator format YYYYMMDDHHmmSS
function WLFormatDate(dateStr) {
    var date = new Date(dateStr);
    if(isNaN(date)){
        // Tires to fix the date before passing it to rigourous parsers (e.g. Mozilla)
        date = new Date(dateStr.replace(/ /g,'T'));
        if(isNaN(date)){
            return 'Invalid date';
        }
    }
    var datestring = '';
    datestring += date.getUTCFullYear();
    datestring += WLAddZero(date.getUTCMonth()+1);//  getMonth start at 0
    datestring += WLAddZero(date.getUTCDate());
    datestring += WLAddZero(date.getUTCHours());
    datestring += WLAddZero(date.getUTCMinutes());
    datestring += WLAddZero(date.getUTCSeconds());
    return datestring;
}

// Formats the dateStr in the readable format YYYY-MM-DD HH:mm:SS
function WLPrintDate(dateStr){
    var formatted = WLFormatDate(dateStr);
    var date = formatted.substr(0, 4) + '-' + formatted.substr(4, 2)+ '-' + formatted.substr(6, 2);

    if (formatted.substr(8, 6) != '000000'){
        date += ' '+formatted.substr(8, 2) + ':' + formatted.substr(10, 2)+ ':' + formatted.substr(12, 2);
    }
    return date;
}

// Extracts the domain name from an archive url.
var WLDomainRegExp = new RegExp('(?:https?://)?(?:www\\.)?((?:[A-Za-z0-9_\\.])+)(?:/.*)?','i');
function WLPrintDomainName(url) {
    var match = url.match(WLDomainRegExp);
    if (match){
        if (match.length > 1) {
            var domain_name =  match[1];
            var max_length = 15;
            if (domain_name.length > max_length){
                return domain_name.substr(0, max_length) + '...';
            }
            return domain_name;
        }
    }
    return 'unknown archive';
}

// Keeps track of the last open menu to close it.
var WLLastOpen;
function WLCloseLastOpen(){
    if(WLLastOpen){
        WLLastOpen.setAttribute('aria-hidden', 'true');
        WLLastOpen = null;
    }
}

// Extracts information 
function WLGetAttribute(obj, str){
    try{
        return obj.getAttribute(str).trim();
    } catch(err) {
        return "";
    }
}

// Apply the script at the end of the loading.
document.addEventListener('DOMContentLoaded', function() {

    // Extracts page information
    var metas = document.getElementsByTagName("meta");
    var metaDates = {}

    for(var i=0; i<metas.length; i++) {
        var metaAttr = WLGetAttribute(metas[i], "item-prop");
        if (metaAttr in WLSchemaOrgAttributes) { 
            var mdate = WLGetAttribute(metas[i], "content");
            metaDates[metaAttr] = {"linkstr": "", "printstr": ""};
            metaDates[metaAttr]["linkstr"] = WLFormatDate(mdate);
            metaDates[metaAttr]["printstr"] = WLPrintDate(mdate);
        }
    }

    // For every <a> link
    var links = document.getElementsByTagName("a");
    for(var i=0; i<links.length; i++) {
        // Extracts link information
        var linkHREF =  WLGetAttribute(links[i], 'href');
        if (!linkHREF.search("http") == 0) {
            var loc = window.location;
            var abLink = loc.protocol + "//" + loc.host;
            if (!linkHREF.search("/|../|./") == 0) {
                abLink += "/";
            }
            linkHREF = abLink + linkHREF;
        }

        // The original is either in the attribute or in the href
        var original =  WLGetAttribute(links[i], 'data-original-url');
        var hasOriginal = Boolean(original);
        if (!hasOriginal){
            original = linkHREF;
        }
        // The memento url is either data-version-url or in the href if data-original-url exists
        var memento =  WLGetAttribute(links[i], 'data-version-url');
        var hasMemento = Boolean(memento);
        if(!hasMemento && hasOriginal) {
            memento = linkHREF;
        }
        // The datetime is the data-versiondate
        var datetime = WLGetAttribute(links[i], 'data-version-date');
        var hasDatetime = Boolean(datetime);

        // Menu appearance conditions
        // Constructs the regular expression of restricted URIs from the baseRestrictedURI and the ones given in parameters
        var WLRestrictedRegexp = new RegExp('(?:'+WLuriPatternsToExclude.concat(WLWebArchiveBaseUriToExclude).join(')|(?:')+')');

        var showLink  = (links[i].href.length > 0 &&  // no inner/empty links
            (' ' + links[i].className+' ').indexOf(' waybackLinks ') < 0 &&  // not a link we created
            ((Object.keys(metaDates).length > 0 || hasOriginal || hasMemento || hasDatetime) && // one menu item at least
            ! WLRestrictedRegexp.test(linkHREF)) && // .href can be rewritten. but so is the regexp 
            WLIsURL(linkHREF));  // test the cleaned uri

        if (showLink){
            var popupID = WL_ID();

            var waybackLinksElement = document.createElement('span');
            waybackLinksElement.setAttribute('role',"navigation");
            waybackLinksElement.setAttribute('aria-label', 'WLElement');

            // Only one menu (the arrow link)
            var outer = document.createElement('ul');
            var dropDownList = document.createElement('li');
            dropDownList.setAttribute('aria-label', 'WLOuter');
            var arrowDown = document.createElement('a');
            arrowDown.href = "";
            arrowDown.setAttribute('aria-haspopup', 'true');
            arrowDown.setAttribute('class', 'waybackLinks dropDownButton WLArrow');
            arrowDown.setAttribute('aria-controls', popupID);

            // The link glyph
            var linkChar = document.createElement('div');
            linkChar.setAttribute('class','waybackLinks dropDownButton WLIcon');

            // The dropdown menu
            var dropDownItem = document.createElement('ul');
            dropDownItem.setAttribute('class', 'WLMenu');
            dropDownItem.id = popupID;
            dropDownItem.setAttribute('aria-hidden', 'true');

            // Adds the title to the dropdown menu
            var listItem = document.createElement('li');
            listItem.setAttribute('class', 'WLTitle');
            listItem.innerHTML = 'Wayback Links';
            dropDownItem.appendChild(listItem);

            // Adds the Menu Items to the dropdown menu
            for (metaAttr in metaDates) {
                var link = "https:"+"//timetravel.mementoweb.org/memento/"+metaDates[metaAttr]["linkstr"]+'/'+original;
                WL_appendHiddenLink(dropDownItem, WLSchemaOrgAttributes[metaAttr] + metaDates[metaAttr]["printstr"], link);
            }
            if(hasDatetime){
                var linkDateStr = WLFormatDate(datetime);
                var link = "https:"+"//timetravel.mementoweb.org/memento/"+linkDateStr+'/'+original;
                WL_appendHiddenLink(dropDownItem, 'Get near link date '+ WLPrintDate(datetime), link);
            }
            if(hasMemento || hasOriginal){
                WL_appendHiddenLink(dropDownItem, 'Get from '+ WLPrintDomainName(memento), memento);
            }
            if(hasOriginal){
                WL_appendHiddenLink(dropDownItem, 'Get at current date', original);
            }

            dropDownList.appendChild(arrowDown);
            dropDownList.appendChild(dropDownItem);

            outer.appendChild(dropDownList);
            waybackLinksElement.appendChild(outer);

            arrowDown.parentNode.insertBefore(linkChar, arrowDown);

            // Adds the click function which toggles the aria-hidden Boolean
            arrowDown.onclick = function(e) {
                var region = document.getElementById(this.getAttribute('aria-controls'));
                var isClosed = region.getAttribute('aria-hidden') == 'true' ;
                WLCloseLastOpen();
                  if (isClosed) {
                    region.setAttribute('aria-hidden', 'false');
                    WLLastOpen = region;
                  } else { // region is expanded
                       region.setAttribute('aria-hidden', 'true');
                       WLLastOpen = null;
                }

                e.stopPropagation();

                return false;

            };

            // Insert the waybackLinks element directly after the link
            links[i].parentNode.insertBefore(waybackLinksElement, links[i].nextSibling);
        }

    }

    // Clicking anywhere closes the RLLastOpen menu item if it is present.
    document.onclick = WLCloseLastOpen;

    /*
    // Show the 'powered by WaybackLinks' link
    if (RLshowFooter){
        var footer = document.createElement('footer');
        footer.setAttribute('class', "RLFooter");
        footer.innerHTML = '<span style="">Powered by: </span><span><a href="http://robustlinks.mementoweb.org/">Robust Links</a></span> <span class="RLIcon">'+'</span>';
        document.getElementsByTagName('body')[0].appendChild(footer);
    }
    */
}, false);