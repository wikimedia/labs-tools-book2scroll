/*
	Originally write by Magnus Manske
	Rewite by Jay Prakash
 */
$(function () {

	// Global variable from URL
    var d = location.href.split('/').slice(-2),
        s_lang = d[0],
        s_page = decodeURIComponent(d[1]);

    // Global variables
    var pages = {},
		first_page = 1,
		curren_page = first_page,
		last_page = 0,
		image_width,
		image_height,
		image_thumbnail_url,
		thumb_width,
		thumb_height;

    /*
	 *  <--------------- Ajax requests to set required values for global variables ------------->
	 */

	$.ajax( {
		url: 'https://'+s_lang+'.wikisource.org/w/api.php',
		data: {
			action:'query',
			titles:'File:'+ s_page,
			prop:'imageinfo',
			iiprop:'url|size|dimensions',
			origin: "*",
			format:'json'
		},
		async: false,
		cache:false,
		success: function ( data ) {
			var d = data.query.pages[Object.keys(data.query.pages)[0]];

			total_pages = d.imageinfo[0].pagecount;
			image_width = d.imageinfo[0].width;
			image_height = d.imageinfo[0].height;

			// Check last page
			if (total_pages < last_page || last_page == 0) {
				last_page = total_pages
			}

			createSkeleton(first_page, last_page);

			var want_height = $('#body').height(),
				want_width = want_height * image_width / image_height,
				size = Math.floor(want_width / 100) * 100;

			while (size * 2 + 50 > $('#container').width()) size -= 100;

			$.ajax({
				url: 'https://' + s_lang + '.wikisource.org/w/api.php',
				data: {
					action: 'query',
					titles: 'File:' + s_page,
					prop: 'imageinfo',
					iiurlwidth: size,
					iiprop: 'url|size|dimensions',
					origin: "*",
					format: 'json'
				},
				async: false,
				cache: false,
				success: function (data) {
					var d = data.query.pages[Object.keys(data.query.pages)[0]];

					image_thumbnail_url = d.imageinfo[0].thumburl;
					thumb_width = d.imageinfo[0].thumbwidth;
					thumb_height = d.imageinfo[0].thumbheight;
				}
			});
		}
	}) ;


	/*
	 *  ---------------------------- Callback handlers ----------------------
	 */

	// Handler for page select input field
	$('#page_select').change ( function () {
		var curren_page = $( this ).val(),
			t = $('#page_'+ curren_page).position().top * 1 + $('#body').scrollTop() * 1 ;

		$('#body').scrollTop(t) ;
		load_page ( curren_page ) ;
	} ) ;

	// Click handler for title
	$("#title").on('click', function () {
		if ( $('#pagenav').is(':visible') ) {
			$('.header-hideable').fadeOut('slow') ;
		} else {
			$('.header-hideable').fadeIn('slow') ;
		}
	});

	// Handler for scrolling in body
	$('#body').scroll ( function () {
		var h = $('#body').height();
		var p_start = $('#page_select').val();
		if (!p_start) p_start = first_page;

		p_start++;
		do {
			p_start--;
			var pt = $('#page_' + p_start).position()['top'];
			var pb = pt + $('#page_' + p_start).height();
		} while (pb >= 0 && p_start > first_page) ;

		for (var p = p_start; p <= last_page; p++) {
			var pt = $('#page_' + p).position()['top'];
			var pb = pt + $('#page_' + p).height();
			if (pb < 0) continue;
			if (pt > h) break;
			;

			if (pages[p]) {
				if (pages[p + 1]) load_page(p + 2);
				else load_page(p + 1);
			} else {
				load_page(p);
			}
			break;
		}
	});

	// Check buttons handler
	$("#show_headers,#show_text,#show_image").each(function() {
		$(this).on('click', function () {
			show_headers('#body');
		});
	});


	/*
	 *  <---------------------------- Helper functions ---------------------->
	 */

	function show_page ( page , level ) {
		var h = '' ;
		h += '<div class="page-number"><b>' + page + '</b>' ;
		h += '<br/><a href="'+pages[page].server+'/wiki/Page:' + pages[page].page_title + '">view</a>' ;
		h += '<br/><a href="'+pages[page].server+'/w/index.php?action=edit&title=Page:' + pages[page].page_title + '">edit</a>' ;
		h += '</div>' ;
		h += '<div class="page-text" style="width:' + pages[page].image_width + 'px">' + pages[page].text + '</div>';
		h += '<div class="page-vsep" style="height:' + pages[page].image_height + 'px"></div>';
		h += '<div class="page-image"><img src="' + pages[page].image_url + '" /></div>';

		$('#page_'+page).height ( 'auto' ) ;
		$('#page_'+page).html ( h ) ;
	}

	function get_thumbnail_url ( page ) {
		var filetype = '.' + s_page.split('.').pop() ;
		var s = filetype + '/page1-' ;
		var t = filetype + '/page' + page + '-' ;
		var ret = image_thumbnail_url.split(s) ;
		ret = ret.join(t) ;
		return ret ;
	}

	function adjust_body_width ( nw ) {
		var bw = $('#body').width() ;
		var rbw = $('#container').width() ;
		var l = Math.floor((rbw-nw)/2) ;
		$('#body').width(nw) ;
		$('#body').css({left:l}) ;

		if ( $('#searchmarkers').is(':visible') ) {
			var p = $('#body').offset() ;
			p = p.left + $('#body').width() ;
			$('#searchmarkers').css({left:p+10});
		}

	}
	function show_headers ( root ) {
		var do_show = $('#show_headers').is(':checked'),
			header_classes = [ 'generic_header_class' , 'quality0' , 'quality1' , 'quality2' , 'quality3' , 'quality4' , 'metadata' ];
		$.each ( header_classes , function ( k , classname ) {
			if ( do_show ) $(root+' .'+classname).show() ;
			else $(root+' .'+classname).hide() ;
		} ) ;

		if ( $('#show_text').is(':checked') ) $(root+' .page-text').show() ;
		else $(root+' .page-text').hide() ;

		if ( $('#show_image').is(':checked') ) $(root+' .page-image').show() ;
		else $(root+' .page-image').hide() ;

		if ( $('#show_image').is(':checked') && $('#show_text').is(':checked') ) {
			$(root+' .page-vsep').show() ;
			adjust_body_width ( thumb_width * 2 + 50 ) ;
		} else {
			$(root+' .page-vsep').hide() ;
			adjust_body_width ( thumb_width + 50 ) ;
		}
	}

	// Create HTML structure for first_page to last_page
	function createSkeleton( f_page, l_page){
		$('#title').text(s_page.split('.')[0].replaceAll('_', ' '))
		$('#last_page_number').html ( l_page - f_page + 1 ) ;
		var sel = '<select id="page_select" class="input-small">' ;
		for ( var p = f_page ; p <= l_page ; p++ ) {
			$('#body').append ( '<div class="page" id="page_' + p + '" style="width:100%;background:none;height: auto">(s_page ' + p + ' not loaded)</div>' ) ;
			sel += '<option value="' + p + '">' + p + '</option>' ;
		}
		sel += '</select>' ;
		$('#selbox').html ( sel ) ;
	}

	// Load the particular page
	function load_page ( page ) {
		if ( page > last_page ) return ;
		if ( pages[page] ) return ;
		pages[page] = new Object ;
		pages[page].exists = true ;
		load_image_url ( page ) ;
		load_page_text ( page ) ;
	}


	// Load the text data for a particular page in pages object
	function load_page_text ( page  ) {
		var pagenum = get_pagenum ( page ) ;
		pages[page].lang = s_lang;
		pages[page].page_title = s_page + '/' + pagenum ;
		pages[page].server = 'https://'+ s_lang + '.wikisource.org';
		$.getJSON ( 'https://'+ s_lang + '.wikisource.org/w/api.php?callback=?' , {
			action:'parse',
			page: 'Page:'+ s_page + '/' + pagenum,
			format:'json'
		} ,function ( data ) {
			if ( undefined === data.parse ){
				pages[page].text = '<p style="color: red">This page does not exist.</p>'
			} else {
				pages[page].text = data.parse.text['*'] ;
			}
			pages[page].text_loaded = 1 ;
			show_page ( page ) ;
		} ) ;
	}

	// Load the image data for a particular page in pages object
	function load_image_url ( page  ) {
		pages[page].image_url = get_thumbnail_url(page);
		pages[page].image_width = thumb_width;
		pages[page].image_height = thumb_height;
		pages[page].image_loaded = 1;
		show_page(page);
	}

	// Convert to local number if required
	function get_pagenum(p){
		if( s_lang === "en" ){
			return p;
		}

		var mapData = {
			as: {
				"0": "০",
				"1": "১",
				"2": "২",
				"3": "৩",
				"4": "৪",
				"5": "৫",
				"6": "৬",
				"7": "৭",
				"8": "৮",
				"9": "৯"
			},
			bn: {
				"0": "০",
				"1": "১",
				"2": "২",
				"3": "৩",
				"4": "৪",
				"5": "৫",
				"6": "৬",
				"7": "৭",
				"8": "৮",
				"9": "৯"
			},
			gu: {
				"0": "૦",
				"1": "૧",
				"2": "૨",
				"3": "૩",
				"4": "૪",
				"5": "૫",
				"6": "૬",
				"7": "૭",
				"8": "૮",
				"9": "૯"
			},
			hi: {
				"0": "०",
				"1": "१",
				"2": "२",
				"3": "३",
				"4": "४",
				"5": "५",
				"6": "६",
				"7": "७",
				"8": "८",
				"9": "९"
			},
			kn: {
				"0": "೦",
				"1": "೧",
				"2": "೨",
				"3": "೩",
				"4": "೪",
				"5": "೫",
				"6": "೬",
				"7": "೭",
				"8": "೮",
				"9": "೯"
			},
			mr: {
				"0": "०",
				"1": "१",
				"2": "२",
				"3": "३",
				"4": "४",
				"5": "५",
				"6": "६",
				"7": "७",
				"8": "८",
				"9": "९"
			},
			or: {
				"0": "୦",
				"1": "୧",
				"2": "୨",
				"3": "୩",
				"4": "୪",
				"5": "୫",
				"6": "୬",
				"7": "୭",
				"8": "୮",
				"9": "୯"
			},
			sa: {
				"0": "०",
				"1": "१",
				"2": "२",
				"3": "३",
				"4": "४",
				"5": "५",
				"6": "६",
				"7": "७",
				"8": "८",
				"9": "९"
			}
		};

		if( mapData[s_lang] === undefined ){
			return p;
		}

		var output = '';
		String(p).split('').forEach( function(i){
			output += mapData[s_lang][i];
		} );
		return output;
	}

	/*
	 *  <---------------------------- Initializing ---------------------->
	 */

	$('#body').css({top: '42px', left: '183px', right: '0px', width: '500px'});
	load_page( 1 );
	load_page( 2 );
	adjust_body_width(thumb_width * 2 + 50);
});