'use strict';


angular.module('login', [
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
			.when('/login', {
				title		: 'Login',
				controller	: 'LoginCtrl',
				templateUrl	:  'app/login/login.html'

			})

			.when('/register', {
				title		: 'Register',
				controller	: 'RegisterController',
				templateUrl	:  'app/login/register.html'
			})
	}
])
.factory('User', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/mysql/_table/user/:id', { id: '@id' }, {
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
		return $resource('/api/v2/mysql/_table/schools/:id', { id: '@id' }, {
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



.service('LoginHelper', [
	'$http', '$q', '$cookies', '$rootScope',

	function ($http, $q, $cookies, $rootScope) {
		this.initiate = function (options) {
			var deferred = $q.defer();
			console.log(options);
			$http.post('/api/v2/user/session/', options).then(function (result) {
				$http.defaults.headers.common['X-DreamFactory-Session-Token'] = result.data.session_token;
				$cookies.session_token = result.data.session_token;
				
				$rootScope.user = result.data;
                console.log($rootScope.user)
				try {
					window.localStorage.user = JSON.stringify(result.data);
				} catch (e) { }

 				deferred.resolve();
			}, deferred.reject);

			return deferred.promise;
		};

		this.register = function (options) {
			var deferred = $q.defer();
			
			$http.post('/api/v2/user/register?login=true', options).then(function (result) {
 				deferred.resolve();
			}, deferred.reject);

			return deferred.promise;
		};
	}
])


.controller('LoginCtrl', [
	'$scope', 'LoginHelper', '$location', '$rootScope', 'User', '$mdDialog', 'twitterService', '$cookies',

	function ($scope, LoginHelper, $location, $rootScope, User, $mdDialog, twitterService, $cookies) {
	    twitterService.initialize();
	    
	    $scope.connectedTwitter=false;


		$rootScope.isLoggedIn = false;
		$scope.submit = function () {

		    twitterService.connectTwitter().then(function(){

    			if (twitterService.isReady()){
    			    $scope.connectedTwitter = true;
    				LoginHelper.initiate({
    				    email: $scope.username,
    				    password: $scope.password
    
    				}).then(function (){
    				    $rootScope.isLoggedIn = true;
    				        
                        User.query({
                            filter: '(user_email = "' +  $rootScope.user.email + '")'
                        }).$promise.then(function (result) {
                            $cookies.tableID = result.resource[0].id;
                            $cookies.schoolID = result.resource[0].college_id;
                            window.localStorage.tableID = result.resource[0].id;
                        });
                        $location.path('/profile');
    				})
    			}
			});
		};

		$scope.register = function () {
			$location.path('/register');
		};
	}
])

.directive('pwCheck', [function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            var firstPassword = '#' + attrs.pwCheck;
            $(elem).add(firstPassword).on('keyup', function () {
                scope.$apply(function () {
                    ctrl.$setValidity('pwmatch', elem.val() === scope.password);
                });

            });
        
        }
    }
}])

.controller('RegisterController', [
	'$scope', 'LoginHelper', '$location', '$rootScope', 'User', '$cookies', 'twitterService', '$http', '$q', 
	
	
	



	function ($scope, LoginHelper, $location, $rootScope, User, $cookies, twitterService, $http, $q) {
	    twitterService.initialize();
	    
	    $scope.connectedTwitter=false;

		$rootScope.isLoggedIn = false;
		$scope.stateSelected = false;
		
		
	
	    $http.get('app/schools.json')
            .success(function(data) {
               var statelist = []
				$scope.schools = data
				//console.log($scope.schools)
                $.each($scope.schools, function(state, schools) {
                    statelist.push(state)
                });
                $q.defer().resolve();
                $scope.states = statelist.sort()
            })
            .error(function() {
                $q.defer().reject('could not find schools.json');
            });


		
		var collegelist = []
		$scope.getColleges = function(){
            $scope.stateSelected = true;
		    var schoolList = []
		    $.each($scope.schools[$scope.state], function(count, school){
		        schoolList.push({id: school[1], name: school[0], state: $scope.state})
		    })
		    $scope.colleges = schoolList.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
		}
		
		twitterService.connectTwitter().then(function(){
		    
		    
			if (twitterService.isReady()){
				$scope.connectedTwitter = true;
				if(JSON.parse($cookies.TwitterUserData).name.split(" ").length <= 2){
				    $scope.firstName = JSON.parse($cookies.TwitterUserData).name.split(" ")[0]
				    $scope.lastName = JSON.parse($cookies.TwitterUserData).name.split(" ")[JSON.parse($cookies.TwitterUserData).name.split(" ").length - 1]
				}
				$scope.name = "@"+ JSON.parse($cookies.TwitterUserData).screen_name
				
				$scope.register = function () {
                    var college = $scope.college
			        LoginHelper.register({
                        email: $scope.username,
        				password: $scope.password,
        				first_name: $scope.firstName,
        				last_name: $scope.lastName,
        				name: $scope.name
			        }).then(function () {
            				LoginHelper.initiate({
            				email: $scope.username,
            				password: $scope.password
    			        }).then(function () {
            				$rootScope.isLoggedIn = true;
                            User.create({"user_name":$rootScope.user.name,"user_email":$rootScope.user.email,"user_id":-1,"college_id":college.id}).$promise.then(function  (result) {
                                $cookies.tableID = result.resource[0].id;
                                $cookies.schoolID = college.id;
                            });
    				        $location.path('/profile');
    			        });
			        });
		        };
			}
		})
	} 
])