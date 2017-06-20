'use strict';


angular.module('booksearch', [
	'ngResource',
	'ngRoute',
	'ngMaterial',
	'ngAnimate'
])


.config([
	'$routeProvider',

	function ($routeProvider) {

		// Routes
		$routeProvider
		    .when('/results/:id', {
		    	title    	: 'Results',
		    	templateUrl	: 'app/booksearch/results.html',
		    	controller 	: 'ResultsCtrl',
		    	resolve		: {
		    		book: function ($route) {
		    			return { id: $route.current.params.id };
		    		}
		    	}
		    })
	}
])
.factory('Textbook', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/mysql/_table/book/:id', { id: '@id' }, {
			query: {
				method: 'GET',
				isArray: false
			},
			create: {
				method: 'POST'
			},
			update: {
				method: 'PUT'
			},
			remove: {
				method: 'DELETE'
			}
		});
	}
])
.controller('ResultsCtrl', [
    '$scope', '$location', '$route', '$mdToast', '$mdDialog', '$q', '$filter','book','Textbook', '$rootScope', '$cookies', 'resultsBooksHelper',
    function ($scope, $location, $route, $mdToast, $mdDialog, $q, $filter,book,Textbook, $rootScope, $cookies, resultsBooksHelper) {
    $(function() {

  if (book.id){
  var booksUrl = "https://www.googleapis.com/books/v1/volumes/" + book.id;
  $.getJSON(booksUrl, function(data, textStatus, jqxhr) {
    var dict = {
      ebook: (data.saleInfo.isEbook == null ? "" : data.saleInfo.isEbook),
      title: data.volumeInfo.title,
      id: data.id,
      //author: (data.volumeInfo.authors == null ? "No author info found" : data.volumeInfo.authors[0]),
      authors: (data.volumeInfo.authors == null ? null : data.volumeInfo.authors),
      isbn: data.volumeInfo.industryIdentifiers,
      publishedDate: data.volumeInfo.publishedDate,
      image: (data.volumeInfo.imageLinks == null ? "" : data.volumeInfo.imageLinks.thumbnail),
      small_image: (data.volumeInfo.imageLinks == null ? "" : data.volumeInfo.imageLinks.smallThumbnail),
      description: (data.volumeInfo.description == null ? "" : data.volumeInfo.description),
      publisher: data.volumeInfo.publisher
    };
    $('#divDescription').append('<h2>Book Details</h2>');
    if (dict.image != '') {
      $('#divDescription').append('<img src="' + dict.image + '" style="float: left; padding: 10px;">');

    } else {
		$('#divDescription').append('<img src="app/images/not-found.png" style="float: left; padding: 10px;">');
	}
    if (dict.ebook == true) {
      $('#divDescription').append('<h2>(Ebook version)</h2>');
    }
    $('#divDescription').append('<p><b>Title:</b> ' + dict.title + '</p>');

    if (dict.authors != null) {
        $('#divDescription').append('<p><b>Authors:</b> ' + dict.authors.join(', ') + '</p>');
    } else {
        $('#divDescription').append('<p><b>Authors:</b> No author info found.</p>');
    }
    if (dict.publishedDate != null) {
        $('#divDescription').append('<p><b>First published year:</b> ' + dict.publishedDate + '</p>');
    } else {
        $('#divDescription').append('<p><b>First published year:</b> No publish date info found.</p>');
    }
    $('#divDescription').append('<p><b>Publisher:</b> ' + dict.publisher + '</p>');

    if (dict.isbn && dict.isbn[0].identifier) {
      $('#divDescription').append('<p><b>ISBN:</b> ' + dict.isbn[0].identifier + '</p>');

      $('#divDescription').append('<p>View book on <a href="http://www.worldcat.org/isbn/' + dict.isbn[0].identifier + '" target="_blank">worldcat</a></p>');
      $('#divDescription').append('<p>Some users may own this book in a different edition, <a href="http://books.google.com/books?q=editions:ISBN' + dict.isbn[0].identifier + '&id=' + dict.id + '" target="_blank">check out other versions on google</a> and search their ISBN here</p>');
      if (dict.ebook != true) {
      $('#divDescription').append('<p>If this is a school textbook, and not an eBook, you can view prices from online vendors on <a href="http://www.campusbooks.com/search/'
	+ dict.isbn[0].identifier + '" target="_blank">campusbooks.com</a></p>');
    }

    } else{
        $('#divDescription').append('<p><b>ISBN:</b> No ISBN found, this might not be a printed book.</p></br>');
    };
    // and the usual description of the book
	if (dict.description == "") {
		$('#divDescription').append('<p><b>Description:</b> No description available.</p>');
	} else{
	    //var text = $(dict.description).text()
	    //var text = String(dict.description);
	    var html = dict.description;
        var div = document.createElement("div");
        div.innerHTML = html;
        var text = div.textContent || div.innerText || "";
		$('#divDescription').append('<p class="d"><b>Description:</b></p>');
		if (text.length > 600) {
		$('#divDescription').append('<div class="show-more-snippet">' + dict.description + '</div>');
        $('.show-more-snippet').append('<div class="overlay"></div>');
		$('#divDescription').append('<button class="show-more">Read more...</button>');




		$('.show-more').click(function() {
    if($('.show-more-snippet').css('height') != '55px'){
        $('.show-more-snippet').stop().animate({height: '55px'}, 500);
        $(this).text('Read more...');
        $('.overlay').css({display: 'block'});
    }else{
        $('.show-more-snippet').css({height:'100%'});
        var xx = $('.show-more-snippet').height();
        $('.show-more-snippet').css({height:'55px'});
        $('.show-more-snippet').stop().animate({height: xx}, 500);
        $('.overlay').css({display: 'none'});
        // ^^ The above is beacuse you can't animate css to 100% (or any percentage).  So I change it to 100%, get the value, change it back, then animate it to the value. If you don't want animation, you can ditch all of it and just leave: $('.show-more-snippet').css({height:'100%'});^^ //
        $(this).text('Read less...');

    }
})} else {
    $('#divDescription').append('<div>' + dict.description + '</div>');
}

	}
    
    var tosell = [];
    var tobuy = [];

    resultsBooksHelper.getthings(dict).then(function(result) {
        
        var search = result.resource;
			     
			    for (var count = 0; count < search.length; count++){
			        var obj = search[count];
			        if (obj.book_state == "selling" && obj.user_by_user_id.college_id == $cookies.schoolID) {
			            tosell.push({"tweet_id":obj.tweet_id, "user":obj.user_by_user_id.user_name,"price":obj.price,"condition":obj.condition,"email":obj.user_by_user_id.user_email});
			        };
			        if (obj.book_state == "buying" && obj.user_by_user_id.college_id == $cookies.schoolID) {
			            tobuy.push({"tweet_id":obj.tweet_id, "user":obj.user_by_user_id.user_name,"price":obj.price,"condition":obj.condition,"email":obj.user_by_user_id.user_email});
			        };
			    };
        tosell = tosell.sort(resultsBooksHelper.dynamicSort('price'));
	    tobuy = tobuy.sort(resultsBooksHelper.dynamicSort('price'));
		resultsBooksHelper.build(tosell, tobuy);
    })	
	
	
    
    
    $("#sort3").selectmenu({
		select: function(event, ui) {
            //var thing = edb.expenseDB.allExpenses;
			
			var sortval = resultsBooksHelper.getsortval();
			
			if (tosell.length !== 0 || tobuy.length !== 0 ) {
			    $(".list-group-item-action").remove();
			    tosell = tosell.sort(resultsBooksHelper.dynamicSort(sortval));
			    tobuy = tobuy.sort(resultsBooksHelper.dynamicSort(sortval));
			   
				resultsBooksHelper.build(tosell, tobuy);
			}
		}
	});
	
	
	$("#reverse-sort3").checkboxradio().click(function() {
		//var thing = edb.getTable(); not needed anymore
        //var thing = edb.expenseDB.allExpenses;
	
		var sortval = resultsBooksHelper.getsortval();
		if (tosell.length !== 0 || tobuy.length !== 0) {
		    $(".list-group-item-action").remove();
			tosell = tosell.sort(resultsBooksHelper.dynamicSort(sortval));
			tobuy = tobuy.sort(resultsBooksHelper.dynamicSort(sortval));
		
			resultsBooksHelper.build(tosell, tobuy);
		}
	});
	

	 $scope.addBook = function (ev) {
			$mdDialog.show({
		    	controller: 'BookAddCtrl',
		    	templateUrl: 'app/booksearch/addBook.html',
		    	parent: angular.element(document.body),
		    	targetEvent: ev,
		    	locals: {
		    		book: {isbn: dict.isbn[0].identifier,
		    		       title: dict.title,
		    		       user_id: 1, //$rootScope.user.id,
		    		       image_url: dict.image,
		    		       owner: $rootScope.user.first_name,
		    		       email: $rootScope.user.email,
		    		       is_sold: false
		    		}
		    	}
			})
		};

  }).fail(function(jqxhr, textStatus, errorThrown) {
    console.log(textStatus, errorThrown);
  });
  }


});
}])

.service('resultsBooksHelper', ['Textbook', '$q', '$mdDialog',

	function (Textbook, $q, $mdDialog) {
	    
	    this.getthings = function(dict) {
	        var deferred = $q.defer();
	        Textbook.query({
			filter: '(isbn=' + dict.isbn[0].identifier + ')', //and(' + 'user_by_user_id.college_id=' + $cookies.schoolID +')',
			related: 'user_by_user_id'
		}).$promise.then(function (result) {
		        deferred.resolve(result);
		});
		return deferred.promise;
	    }
	    
	    
		this.build = function (tosell, tobuy) {
			    
			    
			    for(var count=0; count <2; count++){ //build for sale and looking for columns
			        
			        if (count == 0){
        	            var adding_to = document.getElementById("forsale");
        	            var looking_at = tosell;
        	            var empty_msg = "No books being sold!";
        	            //var button_msg = "Buy";
        	        } else {
        	            adding_to = document.getElementById("lookingfor");
        	            looking_at = tobuy;
        	            empty_msg = "No one is looking for this book.";
        	            //button_msg = "Sell To";
        	        }
        	        
        	        if (looking_at.length == 0) {
            	        var newitem = document.createElement("div");
                        newitem.className += "list-group-item list-group-item-action";
    
                        var no_user = document.createElement("p");
                        no_user.className += "list-group-item-text text-center";
                        var b = document.createElement("b");
                        t = document.createTextNode(empty_msg);
                        b.appendChild(t);
                        no_user.appendChild(b);
                        newitem.appendChild(no_user);
    
                        adding_to.appendChild(newitem);
        	        } else {

                	    for(var c=0; c < looking_at.length; c++){
                	        
                           var newitem = document.createElement("div");
                           newitem.className += "list-group-item list-group-item-action";
                           
                           var button = document.createElement("button");
                           button.className += "btn pull-right btn-primary col-md-2";
                           
                           button.dataset.tweet_id = looking_at[c].tweet_id; //"https://twitter.com/realDonaldTrump/status/846672219073863681";
                           button.onclick = function() {
                               window.open("https://twitter.com/a/statuses/" + this.dataset.tweet_id);
                           };
                           
                           var t = document.createTextNode("See Tweet");
                           button.appendChild(t);
                           newitem.appendChild(button);
                           
                           var div = document.createElement("div");
                           div.className += "container-fluid mybooksdiv";
    
                           var user = document.createElement("p");
                           user.className += "list-group-item-text";
                           var b = document.createElement("b");
                           t = document.createTextNode("User: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[c].user);
                           user.appendChild(b);
                           user.appendChild(t);
                           div.appendChild(user);
    
                           var price = document.createElement("p");
                           price.className += "list-group-item-text";
                           b = document.createElement("b");
                           t = document.createTextNode("Offer: ");
                           b.appendChild(t);
                           t = document.createTextNode("$" + looking_at[c].price.toFixed(2));
                           price.appendChild(b);
                           price.appendChild(t);
                           div.appendChild(price);
    
                           var condition = document.createElement("p");
                           condition.className += "list-group-item-text mybooksp";
                           b = document.createElement("b");
                           t = document.createTextNode("Condition: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[c].condition);
                           condition.appendChild(b);
                           condition.appendChild(t);
                           div.appendChild(condition);
                            
                           newitem.appendChild(div);
                            
                           adding_to.appendChild(newitem);
    
                        }; //end for count < looking_at.length
        	        }; //end else (things in array)
			    }; //end for count < 2
			    
			    
		}

	this.getsortval = function() {

	    
	var val = $("#sort3").val();
	
	if ($("#reverse-sort3").prop('checked')) {
		if (val == null || val == "Price") {
			return "-price";
		}  else {
				return "-" + val.toLowerCase();
			}
		
	} else {
		if (val == null || val == "Price") {
			return "price";
		} else {
				return val.toLowerCase();
			}
		}
	}

	

	
	    this.dynamicSort = function(property) {
	var sortOrder = 1;
	if (property[0] === "-") {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function(a, b) {
		if (property.substr(1) == "price" || property.substr(0) == "price") {
			var a = parseFloat(a[property]),
				b = parseFloat(b[property]);
		} else {
			var a = a[property],
				b = b[property];
		}
		var result = (a < b) ? -1 : (a > b) ? 1 : 0;
		return result * sortOrder;
	}
}
	
	    
	    
	}
])


.service('allBooksHelper', ['User', '$q', '$mdDialog', '$cookies',

	function (User, $q, $mdDialog, $cookies) {
	    
	    this.getthings = function() {
	        var deferred = $q.defer();
	        User.query({ 
			filter: '(college_id=' + $cookies.schoolID + ')',
			related: 'book_by_user_id'
		}).$promise.then(function (result) {
		        deferred.resolve(result);
		});
		return deferred.promise;
	    }
	    
		this.build = function (tosell, tobuy) {
		    var num = 0;
		    for(num = 0; num < 2; num++){ //build for sale and looking for columns

			        if (num == 0){
        	            var adding_to = document.getElementById("forsale");
        	            var looking_at = tosell;
        	            var empty_msg = "No books being sold!";
        	        } else {
        	            var adding_to = document.getElementById("lookingfor");
        	            var looking_at = tobuy;
        	            var empty_msg = "No one is looking for this book.";
        	        }

        	        if (looking_at.length == 0) {
            	        var newitem = document.createElement("div");
                        newitem.className += "list-group-item list-group-item-action";
    
                        var no_user = document.createElement("p");
                        no_user.className += "list-group-item-text text-center";
                        var b = document.createElement("b");
                        t = document.createTextNode(empty_msg);
                        b.appendChild(t);
                        no_user.appendChild(b);
                        newitem.appendChild(no_user);
    
                        adding_to.appendChild(newitem);
        	        } else {

                	    for(var count=0; count < looking_at.length; count++){
                	       var newitem = document.createElement("div");
                           newitem.className += "list-group-item list-group-item-action";
                           
                           var image = document.createElement('img');
                           image.className += "mybooksimg";
                           image.src = looking_at[count].img;
                           newitem.appendChild(image);
                           
                           var button = document.createElement("button");
                           button.className += "btn pull-right btn-primary col-md-2";
                           
                           button.dataset.tweet_id = looking_at[count].tweet_id; //"https://twitter.com/realDonaldTrump/status/846672219073863681";
                           button.onclick = function() {
                               window.open("https://twitter.com/a/statuses/" + this.dataset.tweet_id);
                           };
                           
                           var t = document.createTextNode("See Tweet");
                           button.appendChild(t);
                           newitem.appendChild(button);
                           
                           var div = document.createElement("div");
                           div.className += "container-fluid mybooksdiv";
    
                           var title = document.createElement("p");
                           title.className += "list-group-item-text";
                           var b = document.createElement("b");
                           t = document.createTextNode("Title: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].title);
                           title.appendChild(b);
                           title.appendChild(t);
                           div.appendChild(title);
    
                           var user = document.createElement("p");
                           user.className += "list-group-item-text";
                           var b = document.createElement("b");
                           t = document.createTextNode("User: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].user);
                           user.appendChild(b);
                           user.appendChild(t);
                           div.appendChild(user);
    
                           var price = document.createElement("p");
                           price.className += "list-group-item-text";
                           b = document.createElement("b");
                           t = document.createTextNode("Offer: ");
                           b.appendChild(t);
                           t = document.createTextNode("$" + looking_at[count].price.toFixed(2));
                           price.appendChild(b);
                           price.appendChild(t);
                           div.appendChild(price);
    
                           var condition = document.createElement("p");
                           condition.className += "list-group-item-text mybooksp";
                           b = document.createElement("b");
                           t = document.createTextNode("Condition: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].condition);
                           condition.appendChild(b);
                           condition.appendChild(t);
                           div.appendChild(condition);
                            
                           newitem.appendChild(div);
                            
                           adding_to.appendChild(newitem);
    
                        }; //end for count < looking_at.length
        	        }; //end else (things in array)
			    }; //end for count < 2
			
		},

	this.getsortval = function() {

	    
	var val = $("#sort2").val();
	
	if ($("#reverse-sort2").prop('checked')) {
		if (val == null || val == "Price") {
			return "-price";
		}  else {
				return "-" + val.toLowerCase();
			}
		
	} else {
		if (val == null || val == "Price") {
			return "price";
		} else {
				return val.toLowerCase();
			}
		}
	}

	

	
	    this.dynamicSort = function(property) {
	var sortOrder = 1;
	if (property[0] === "-") {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function(a, b) {
		if (property.substr(1) == "price" || property.substr(0) == "price") {
			var a = parseFloat(a[property]),
				b = parseFloat(b[property]);
		} else {
			var a = a[property],
				b = b[property];
		}
		var result = (a < b) ? -1 : (a > b) ? 1 : 0;
		return result * sortOrder;
	}
}
	
	    
	    
	}
])






.controller('allbooksCTRL', [
    '$scope', '$location', '$route', '$mdToast', '$mdDialog', '$q', '$filter','User', '$rootScope', 'allBooksHelper',
    function ($scope, $location, $route, $mdToast, $mdDialog, $q, $filter,User,$rootScope, allBooksHelper) {
    
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksimg { max-width: 10%; height: auto; display: inline; vertical-align: top;}";
    document.head.appendChild(css);

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksdiv {display: inline-block; max-width:351px; }";
    document.head.appendChild(css);
    
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksp {display: block; word-wrap: break-word; }";
    document.head.appendChild(css);
        
    var tosell = [];
    var tobuy = [];

    allBooksHelper.getthings().then(function(result) {
        
        var search = result.resource;
			     
			    for (var count = 0; count < search.length; count++){
			        var obj = search[count];
			        
			        for (var c = 0; c < obj.book_by_user_id.length; c++){
    			        if (obj.book_by_user_id[c].book_state == "selling") {
    			                tosell.push({"tweet_id":obj.book_by_user_id[c].tweet_id, "user":obj.user_name,"price":obj.book_by_user_id[c].price,"condition":obj.book_by_user_id[c].condition,"email":obj.user_email,"img":obj.book_by_user_id[c].image_url,"title":obj.book_by_user_id[c].title});
    			        };
    			        if (obj.book_by_user_id[c].book_state == "buying") {
        			            tobuy.push({"tweet_id":obj.book_by_user_id[c].tweet_id, "user":obj.user_name,"price":obj.book_by_user_id[c].price,"condition":obj.book_by_user_id[c].condition,"email":obj.user_email,"img":obj.book_by_user_id[c].image_url,"title":obj.book_by_user_id[c].title});
    			        };
			        };
			    };
        tosell = tosell.sort(allBooksHelper.dynamicSort('price'));
	    tobuy = tobuy.sort(allBooksHelper.dynamicSort('price'));
		allBooksHelper.build(tosell, tobuy);
    })	
	
	
    
    
    $("#sort2").selectmenu({
		select: function(event, ui) {
            //var thing = edb.expenseDB.allExpenses;
			
			var sortval = allBooksHelper.getsortval();
			
			if (tosell.length !== 0 || tobuy.length !== 0 ) {
			    $(".list-group-item-action").remove();
			    tosell = tosell.sort(allBooksHelper.dynamicSort(sortval));
			    tobuy = tobuy.sort(allBooksHelper.dynamicSort(sortval));
			   
				allBooksHelper.build(tosell, tobuy);
			}
		}
	});
	
	
	$("#reverse-sort2").checkboxradio().click(function() {
		//var thing = edb.getTable(); not needed anymore
        //var thing = edb.expenseDB.allExpenses;
	
		var sortval = allBooksHelper.getsortval();
		if (tosell.length !== 0 || tobuy.length !== 0) {
		    $(".list-group-item-action").remove();
			tosell = tosell.sort(allBooksHelper.dynamicSort(sortval));
			tobuy = tobuy.sort(allBooksHelper.dynamicSort(sortval));
		
			allBooksHelper.build(tosell, tobuy);
		}
	});
	 
     
     
       
}])

.controller('BookAddCtrl', [
	'$scope', '$mdDialog', '$mdToast', 'book', 'Textbook', '$rootScope', '$cookies', 'twitterService',

	function ($mdScope, $mdDialog, $mdToast, book, Textbook, $rootScope, $cookies, twitterService) {
	    $mdScope.book = angular.copy(book);

		$mdScope.info_types = [ 'selling', 'buying'];
		$mdScope.condition = ['Great','Good','Acceptable'];
		
		
		
		
		$mdScope.submit = function () {

            $mdScope.book.user_id = $cookies.tableID;
            var price = $mdScope.book.price
            

            var tweet = "I am " + $mdScope.book.book_state + " the book " + $mdScope.book.title + " on TEXchange for $" + price.toFixed(2) + ". Reply if interested!";

                

            if (tweet.length > 140 ) {
                tweet = tweet.slice(0,-46);
            }
            if (tweet.length > 140 ) {
                alert("tweet too long. Won't be posted to Twitter automatically.")
            }
            
            twitterService.initialize();
            
            twitterService.postTweet(tweet).then(function (done){

                $mdScope.book.tweet_id = done.id_str

                Textbook.create($mdScope.book).$promise.then(function () {

                    $mdToast.show($mdToast.simple().content('Book saved!'));
                    $mdDialog.hide($mdScope.book);
                    window.location.reload();
            });
      
      })
      


  };


		$mdScope.cancel = function () {
			$mdDialog.cancel();
		};
	}
])



.controller('twitterwindowctrl', [
	'$scope', '$mdDialog', '$mdToast', 'Textbook', '$rootScope', '$cookies', 'twitterService', 'tweet',

	function ($mdScope, $mdDialog, $mdToast, Textbook, $rootScope, $cookies, twitterService, tweet) {
	    console.log(tweet);
	    
	    $mdScope.tweet = "https://twitter.com/realDonaldTrump/status/846672219073863681";
	    $mdScope.cancel = function () {
			$mdDialog.cancel();
		};
		
		twitterService.initialize();
        twitterService.showTweet(tweet).then(function(data) {
            document.getElementById("theTweet").innerHTML = data.html;
        });
}])


