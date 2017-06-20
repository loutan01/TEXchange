'use strict';


angular.module('user', [
	'ngRoute',
	'ngResource',
	'ngCookies',
	'ngMaterial',
	'ngAnimate'
])


.run([
	'$rootScope',

	function ($rootScope) {
		try {
			$rootScope.user = JSON.parse(window.localStorage.user);
		} catch (e) {}
	}
])
.config([
	'$routeProvider',

  function ($routeProvider) {
    $routeProvider
      .when('/profile', {
          title     	: 'Profile',
          templateUrl	: 'app/user/user_profile.html',
          controller 	: 'profileCTRL'
        })
       .when('/mybooks', {
		    title    	: 'mybooks',
		    templateUrl	: 'app/user/mybooks.html',
		    controller 	: 'mybooksCTRL' 
	    })
	    .when('/allbooks', {
	        title    	: 'allbooks',
		    templateUrl	: 'app/booksearch/allbooks.html',
		    controller 	: 'allbooksCTRL',
		    resolve		: {
		    		thing: function ($route) {
		    			return ""
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

.factory('College', [
    '$resource',
    function ($resource) {
        return $resource('/api/v2/mysql/_table/school/:id', { id: '@id' }, {
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

.service('UpdateHandler',['$http', '$cookies', '$q', '$rootScope',
  
  function($http,$cookies,$q,$rootScope){
    this.updateProfile = function(options){
      var deferred = $q.defer();
      console.log($http.post('/api/v2/user/profile', options))
      
      $http.post('/api/v2/user/profile', options).then(function (result) {
          
 				deferred.resolve(result);
			}, deferred.reject);

			return deferred.promise;
    }
    this.getSession = function(){
      var deferred = $q.defer();
      $http.get('/api/v2/user/profile').then(function (result){
        console.log('profile',result)
        deferred.resolve(result);
      },deferred.reject);
      
      //console.log(deferred.promise)
      return deferred.promise;
    }
  }
])



.controller('profileCTRL', [
	'$scope','$location', '$route', '$mdToast', '$q', '$filter', '$rootScope','$cookies','$http', 'College', 'UpdateHandler','$window',

	function ($scope, $location, $route, $mdToast, $q, $filter, $rootScope, $cookies, $http, College, UpdateHandler,$window) {
	   
	    $scope.editorEnabled = false;
	    
	    College.query({
	        filter: '(school_id = "'+ $cookies.schoolID + '")'
	    }).$promise.then(function(result){
	        var img_url = JSON.parse($cookies.TwitterUserData).profile_image_url.split('_normal')
            var large_img_url = img_url[0]+img_url[1]
            
            
	        document.getElementById('UserPic').src = large_img_url
	       	document.getElementById('twitterHandle').innerHTML = $rootScope.user.name;
	        document.getElementById('first_name').innerHTML = $rootScope.user.first_name;
	        document.getElementById('last_name').innerHTML = $rootScope.user.last_name;
	        document.getElementById('email').innerHTML = $rootScope.user.email;
	        document.getElementById('name').innerHTML = result.resource[0].name;
	        document.getElementById('state').innerHTML = result.resource[0].state;
	        
	    })
	    
	    $scope.cancelEdit = function(){
	        $scope.editorEnabled = false;
	    }
	    
	    $scope.contactAdministrators = function(){
	        $window.alert("This functionality is cuttently not supported by Dreamfactory. Please contact a TEXchange administrator.")
	    }
	    
	    
	    $scope.submitEdit = function(){
	        UpdateHandler.updateProfile({
	            email: $scope.editableEmail,
                first_name:  $scope.editableFirstName,
        	    last_name:  $scope.editableLastName
	        }).then(function (result){
	            UpdateHandler.getSession({
	                
	            }).then(function(result2){
	                console.log(result2)
	            })
	            $rootScope.user.email = result.config.data.resource[0].email
	            $rootScope.user.first_name = result.config.data.resource[0].first_name
	            $rootScope.user.last_name = result.config.data.resource[0].last_name
	            	        
	            $route.reload()
	        })
	        

	    }
	   
	    
	    
	    $scope.getColleges = function(){
            $scope.stateSelected = true;
		    var schoolList = []
		    $.each($scope.schools[$scope.EditableState], function(count, school){
		        schoolList.push({id: school[1], name: school[0], state: $scope.state})
		    })
		    console.log(schoolList)
		    $scope.EditableColleges = schoolList.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
		}
	    
	    
	    
	    $scope.editProfile = function() {
	        
	        $scope.stateSelected = false;
	        
	        $http.get('app/schools.json')
            .success(function(data) {
               var statelist = []
				$scope.schools = data
	
                $.each($scope.schools, function(state, schools) {
                    statelist.push(state)
                });
                $q.defer().resolve();
                
                $scope.editorEnabled = true;
                
                statelist = statelist.sort()
                
                for(var count = 0; count < statelist.length; count++){
                    if(statelist[count] == document.getElementById('state').innerHTML){
                        var provinceCount=count;
                    }
                    
                }
                
                
                $scope.$watch('editorEnabled', function(){
	        
        	        var schoolList = []
        		    $.each($scope.schools[$scope.EditableState], function(count, school){
        		        schoolList.push({id: school[1], name: school[0], state: $scope.state})
        		    })
        		    
        		    schoolList = schoolList.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
        		    
        		    $scope.EditableColleges = schoolList
        		    
        		    
        		    for(var count = 0; count < schoolList.length; count++){
    
        		        if(schoolList[count].name == document.getElementById('name').innerHTML){
        		            var schoolListCount = count;
        		        }
        		    }
        		    
    		        $scope.EditableCollege = schoolList[schoolListCount]

	            })
                
                
	            $scope.editableFirstName =  document.getElementById('first_name').innerHTML
	            $scope.editableLastName =  document.getElementById('last_name').innerHTML 
	            $scope.editableEmail = document.getElementById('email').innerHTML
	            $scope.EditableState = statelist[provinceCount]
                $scope.EditableStates = statelist

            })
            .error(function() {
                $q.defer().reject('could not find schools.json');
            });
	        
	       
	    };
	    

	}
])


.service('myBooksHelper', ['User', '$q', '$mdDialog', 'Textbook', '$rootScope', '$cookies',

	function (User, $q, $mdDialog, Textbook, $rootScope, $cookies) {
	    
	    var thisService = this;
	    
	    this.getthings = function() {
	        var deferred = $q.defer();
	        Textbook.query({ 
			filter: '(user_id=' + $cookies.tableID + ')'
		}).$promise.then(function (result) {
		        deferred.resolve(result);
		});
		return deferred.promise;
	    }
	    
		this.build = function (tosell, tobuy) {
		        var remove = function() {
		            var self = this
		            var buttonid = this.id;
		            User.query({
		                filter: '(id=' + $cookies.tableID + ')',
		                related: 'book_by_user_id'
		            }).$promise.then(function (result) {
		                //var thebook = undefined;
		                for (var count = 0; count < result.resource[0].book_by_user_id.length; count++){
		                    if (buttonid == result.resource[0].book_by_user_id[count].id){

                                Textbook.remove({
                                    id: self.id
                                }).$promise.then(function () {
                                    var found = false;
                                    for(var i= 0; i < tosell.length; i++){
                                        if (self.id == tosell[i].id){
                                            found = true;
                                            tosell.splice(i,1);
                                            $(".list-group-item-action").remove();
                                            thisService.build(tosell,tobuy);
                                        }
                                    }
                                    if (found == false){
                                        for(var i= 0; i < tobuy.length; i++){
                                        if (self.id == tobuy[i].id){
                                            found = true;
                                            tobuy.splice(i,1);
                                            $(".list-group-item-action").remove();
                                            thisService.build(tosell,tobuy);
                                        }
                                    }
                                    }
                                }); 

		                    };
		                }

                            
		                 
		            })
		             
                    
                    }; //end remove func
		    
		    
			    //books in the "for sale" column
        	    var selling = document.getElementById("forsale");

        	    for(var c = 0; c < 2; c++){ //build for sale and looking for columns
			        
			        if (c == 0){
        	            var adding_to = document.getElementById("forsale");
        	            var looking_at = tosell;
        	            var empty_msg = "You are not selling any books!";
        	            var button_msg = "Buy";
        	        } else {
        	            adding_to = document.getElementById("lookingfor");
        	            looking_at = tobuy;
        	            empty_msg = "You are not looking for any books.";
        	            button_msg = "Sell To";
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
                	        console.log(looking_at.length);
                	        console.log(looking_at[count]);
                	       var newitem = document.createElement("div");
                           newitem.className += "list-group-item list-group-item-action";
                           
                           var image = document.createElement('img');
                           image.className += "mybooksimg";
                           image.src = looking_at[count].image_url;
                           newitem.appendChild(image);
                           
                           var button = document.createElement("button");
                           button.className += "btn pull-right btn-primary col-md-2";
                           
                           var button = document.createElement("button");
                           button.className += "btn pull-right btn-primary col-md-2";
                           button.id = looking_at[count].id;
                           button.onclick = remove;
                           var t = document.createTextNode("Remove");
                           button.appendChild(t);
                           newitem.appendChild(button);
                           
                           var b = document.createElement("button");
                           b.className += "btn pull-right btn-primary col-md-2 mybooksb";
                           
                           b.dataset.tweet_id = looking_at[count].tweet_id; //"https://twitter.com/realDonaldTrump/status/846672219073863681";
                           b.onclick = function() {
                               window.open("https://twitter.com/a/statuses/" + this.dataset.tweet_id);
                           };
                           var t = document.createTextNode("See Tweet");
                           b.appendChild(t);
                           newitem.appendChild(b);
                           
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

	    
	var val = $("#sort").val();
	
	if ($("#reverse-sort").prop('checked')) {
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







.controller('mybooksCTRL', [
    '$scope', '$location', '$route', '$mdToast', '$mdDialog', '$q', '$filter','Textbook', '$rootScope', 'myBooksHelper',
    function ($scope, $location, $route, $mdToast, $mdDialog, $q, $filter,Textbook,$rootScope, myBooksHelper) {

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksimg { max-width: 10%; height: auto; display: inline; vertical-align: top; }";
    document.head.appendChild(css);

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksdiv {display: inline-block; max-width:450px; }";
    document.head.appendChild(css);
    
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksp {display: block; word-wrap: break-word; }";
    document.head.appendChild(css);
    
    var css = document.createElement("style"); 
    css.type = "text/css"; 
    css.innerHTML = ".mybooksb { margin-right: 5px;}"; 
    document.head.appendChild(css);
    
    
    
    var tosell = [];
    var tobuy = [];

    myBooksHelper.getthings().then(function(result) {
        
        var search = result.resource;
			        
			        for (var count = 0; count < search.length; count++){
			        var obj = search[count];
			        if (obj.book_state == "selling") {
			            tosell.push(obj);
			        };
			        if (obj.book_state == "buying") {
			            tobuy.push(obj);
			        };
			    };
			    
        tosell = tosell.sort(myBooksHelper.dynamicSort('price'));
	    tobuy = tobuy.sort(myBooksHelper.dynamicSort('price'));
		myBooksHelper.build(tosell, tobuy);
    })
    
    $("#sort").selectmenu({
		select: function(event, ui) {
            //var thing = edb.expenseDB.allExpenses;
		
			var sortval = myBooksHelper.getsortval();
			
			if (tosell.length !== 0 || tobuy.length !== 0 ) {
			    	$(".list-group-item-action").remove();
			    tosell = tosell.sort(myBooksHelper.dynamicSort(sortval));
			    tobuy = tobuy.sort(myBooksHelper.dynamicSort(sortval));
			   
				myBooksHelper.build(tosell, tobuy);
			}
		}
	});
	
	
	$("#reverse-sort").checkboxradio().click(function() {
		//var thing = edb.getTable(); not needed anymore
        //var thing = edb.expenseDB.allExpenses;
		
		var sortval = myBooksHelper.getsortval();
		if (tosell.length !== 0 || tobuy.length !== 0) {
		    $(".list-group-item-action").remove();
			tosell = tosell.sort(myBooksHelper.dynamicSort(sortval));
			tobuy = tobuy.sort(myBooksHelper.dynamicSort(sortval));
		
			myBooksHelper.build(tosell, tobuy);
		}
	});
    
}])

