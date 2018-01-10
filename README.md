# Wayback Links

## Development

To build, simply run the following commands:
* `npm install`
* `gulp compile`

## Installation

### Add Wayback Links To Your Webpages

Simply append the following lines to the `<head>` of your HTML source:

```html
<link rel="stylesheet" type="text/css" href="https://github.com/Eagle19243/Wayback-Links/blob/master/build/js/wayback-links.min.css" />
<script type="text/javascript" src="https://github.com/Eagle19243/Wayback-Links/blob/master/build/js/wayback-links.min.js"></script>
```

## WaybackLinks Menu

After adding the WaybackLinks javascript and css to your HTML file, a new link icon will appear next to all the decorated links in the page. Clicking the down arrow in this link icon will pop up a menu with one or more of the following items, depending on the decoration attributes provided in each of the links.

* `Get near link date ...`: When clicking this menu item, the javascript library will use the datetime provided in the `data-versiondate` attribute along with the original url and redirect you to the closest archived playback page.

* `Get from ...`: Clicking this menu item will redirect you to the playback page url provided in the `data-versionurl` attribute.

* `Get at current date`: Clicking this menu item will take you to the original url provided in the `data-originalurl` attribute.

* `Get near page creation date ...`: This menu item is similar to the `Get near link date ...`, except it uses the [Schema.org](http://schema.org) attribute `datePublished`, if provided in the linking HTML page. 

* `Get near page modified date ...`: This menu item is similar to the `Get near link date ...`, except it uses the [Schema.org](http://schema.org) attribute `dateModified`, if provided in the linking HTML page. 


