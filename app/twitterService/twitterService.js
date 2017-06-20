angular.module('twitterService', []).factory('twitterService', function($q, $cookies) {

    var authorizationResult = false;

    return {
        initialize: function() {
            //initialize OAuth.io with public key of the application
            OAuth.initialize('OATH TOAKEN HERE', {cache:true});
            //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
            authorizationResult = OAuth.create('twitter');
        },
        isReady: function() {
            return (authorizationResult);
        },
        connectTwitter: function() {
            var deferred = $q.defer();
            OAuth.popup('twitter', {cache:true}, function(error, result) { //cache means to execute the callback if the tokens are already present
                if (!error) {
                    authorizationResult = result;
                    var url = '/1.1/account/verify_credentials.json';
                    var promise = authorizationResult.get(url).done(function(data) { //https://dev.twitter.com/rest/reference/get/account/verify_credentials
                        var TwitterUserData = [
                            {
                              "name": data.name,
                              "screen_name" : data.screen_name,
                              "profile_image_url" : data.profile_image_url

                            }

                        ];


                        $cookies.TwitterUserData = JSON.stringify(TwitterUserData[0]);

                        deferred.resolve(TwitterUserData);
                    });

                } else {
                    //do something if there's an error

                }
            });
            return deferred.promise;
        },

        showTweet: function(tweet) {
          var deferred = $q.defer();
          var url = "https://publish.twitter.com/oembed?url=" + tweet;

          var promise = authorizationResult.get(url).done(function(data) {
                //when the data is retrieved resolve the deferred object
                //console.log(authorizationResult.get(url))
                deferred.resolve(data);
                console.log('data: ', data)
            }).fail(function(err) {
                console.log('error: ', err)
               //in case of any error we reject the promise with the error object
                deferred.reject(err);
            });
            //return the promise of the deferred object
            return deferred.promise;
        },

        postTweet: function(tweet){
            var deferred = $q.defer();
            var url = "/1.1/statuses/update.json?status=" + encodeURI(tweet) + " %23TEXchange";
            console.log(url);

            var promise = authorizationResult.post(url).done(function(data) {
                deferred.resolve(data);
                console.log('data: ', data)
            }).fail(function(err) {
                console.log('error: ', err)
                deferred.reject(err);
            });
            return deferred.promise;
        },

        clearCache: function() {
            OAuth.clearCache('twitter');
            authorizationResult = false;
        }
    }

})
