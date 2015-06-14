var MainCtrl = function(posts, auth) {
	var self = this;

	self.isLoggedIn = auth.isLoggedIn;

	// self.posts is now using the factory below called 'posts'
	self.posts = posts.posts;

	self.addPost = function(){
		if (!self.name || self.name === '') { return; }

		posts.create({
			name: self.name,
		});

		self.name = "";
	}

	self.incrementUpvote = function(post){
		// old way pre mongo server 
		// post.upvotes += 1;

		posts.upvote(post);
	}

}

var PostsCtrl = function(posts, post, auth){
	var self = this;

	self.isLoggedIn = auth.isLoggedIn;
	//CP self.author = auth.currentUser;

	self.notesTabActive = true;

	// WYSIWYG Menu items
	self.customWYSIWYGMenu = [
		['h1', 'h2', 'h3', 'p'],
		['bold', 'italics', 'underline'],
		['ul', 'ol'],
		['justifyLeft', 'justifyCenter', 'justifyRight']
	];

	//Initial orderBy Field
	self.orderBy = "-hire";
	self.setOrder = function(order){
		self.orderBy = order;
	};

	//Date Picker stuff
	self.today = function(){
		self.dt = new Date();
	};
	self.today();

	self.maxDate = new Date() +1;

	self.clearDate = function(){
		self.dt = null;
	};

  	self.dateFormat = 'dd-MMMM-yyyy';

  	self.datePickerOpen = function($event) {
    	$event.preventDefault();
    	$event.stopPropagation();

    	self.datePickerOpened = true;
  	};

  	// End of Date Picker

  	// Initial recommendation to Hire
  	self.hire = "Not Entered by Interviewer";

  	// Start of Ratings
  	//self.overallRating = 7;
  	self.maxRating = 10;
  	self.isRatingReadonly = false;

  	self.ratingHoveringOver = function(value) {
    	self.overStar = value;
    	self.ratingPercent = 100 * (value / self.maxRating);
  	};

	self.post = post;

	self.addComment = function(){
		if (!self.body || self.body === '') { return; }
		//if (!self.author || self.author === '') { return; }

		/*
		self.post.comments.push({
			author: 'user',
			body: self.body,
			upvotes: 0
		});
		*/

		posts.addComment(post._id, {
			body: self.body,
			author: 'user',
			upvotes: 0
		}).success(function(comment){
			self.post.comments.push(comment);
		});

		self.body = '';
	}

	self.incrementUpvote = function(post){
		posts.upvoteCandidate(post);
	}

	self.addInterview = function(){
		//if (!self.interviewBody || self.interviewBody === '') { return; }
		//if (!self.author || self.author === '') { return; }

		posts.addInterview(post._id, {
			body: self.interviewBody,
			author: 'user',
			goodAnswers: self.interviewGoodAnswers,
			badAnswers: self.interviewBadAnswers,
			date: self.dt,
			maxRating: self.maxRating,
			overallRating: self.overallRating,
			cultureRating: self.cultureRating,
			knowledgeRating: self.knowledgeRating,
			leadershipRating: self.leadershipRating,
			hire: self.hire,
			upvotes: 0
		}).success(function(interview){
			self.post.interviews.push(interview);

			//if the interviewer has marked Yay for hire recommendation, then increase the candidate's upvote
			if (self.hire == 'Yay'){
				self.incrementUpvote(self.post);	
				self.hire = '';			
			}

		});

		//reset form fields
		self.interviewBody = '';
		self.goodAnswers = '';
		self.badAnswers = '';
		self.overallRating = 0;
		self.cultureRating = 0;
		self.knowledgeRating = 0;
		self.leadershipRating = 0;
		self.ratingPercent = 0;
		//self.hire='Not Entered by Interviewer';

		self.activateTab = true;

	}

}

var AuthCtrl = function($scope, $state, auth){
	$scope.user = {};

	$scope.register = function(){
		auth.register($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$state.go('home');
		});
	};

	$scope.logIn = function(){
		auth.logIn($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$state.go('home');
		});
	};
}

var NavCtrl = function($scope, auth){
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.logOut = auth.logOut;
}

var postsFactory = function($http, auth){
	var o = {
		posts: []	//this is where posts.posts happen above
	};

	o.getAll = function() {
		return $http.get('/posts').success(function(data){
			angular.copy(data, o.posts);
		});
	};

	o.create = function(post){
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			o.posts.push(data);
		});
	};

	o.upvote = function(post){
		return $http.put('/posts/' + post._id + '/upvote', null, {
				headers: {Authorization: 'Bearer '+auth.getToken()}
			}).success(function(data){
				post.upvotes += 1;
			});
	};

	o.get = function(id){
		return $http.get('/posts/' + id).then(function(res){
			return res.data;
		});
	};

	o.addComment = function (id, comment){
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	o.upvoteComment = function (post, comment){
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
				headers: {Authorization: 'Bearer '+auth.getToken()}
			}).success(function(data){
				comment.upvotes += 1;
			});
	};

	o.upvoteCandidate = function (post){
		return $http.put('/posts/' + post._id + '/upvote', null, {
				headers: {Authorization: 'Bearer '+auth.getToken()}
			}).success(function(data){
				post.upvotes += 1;
				console.log("upvoteupvoteupvote");
			});
	};

	o.addInterview = function (id, interview){
		return $http.post('/posts/' + id + '/interviews', interview, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	return o;
}

var authFactory = function($http, $window){
	var auth = {};

	auth.saveToken = function(token){
		$window.localStorage['hackathon4-token'] = token;
	};

	auth.getToken = function(){
		return $window.localStorage['hackathon4-token'];
	};

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if (token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function(){
		if (auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function(){
		$window.localStorage.removeItem('hackathon4-token');
	};

	return auth;
}

var app = angular.module('seekInterviews', ['ui.router', 'ui.bootstrap', 'textAngular', 'wysiwyg.module']);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			controllerAs: 'main',
			resolve: {
				postPromise: ['posts', function(posts){
					return posts.getAll();
				}]
			}
		})
		.state('posts', {
			url: '/posts/{id}',
			templateUrl: '/posts.html',
			controller: 'PostsCtrl',
			controllerAs: 'posts',
			resolve: {
				post: ['$stateParams', 'posts', function($stateParams, posts) {
					return posts.get($stateParams.id);
				}]
			}
		})
		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if(auth.isLoggedIn()){
					$state.go('home');
				}
			}]
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if(auth.isLoggedIn()){
					$state.go('home');
				}
			}]
		});

	$urlRouterProvider.otherwise('home');
}]);

app.directive('bindHtmlUnsafe', function( $compile ) {
    return function( $scope, $element, $attrs ) {

        var compile = function( newHTML ) { // Create re-useable compile function
            newHTML = $compile(newHTML)($scope); // Compile html
            $element.html('').append(newHTML); // Clear and append it
        };

        var htmlName = $attrs.bindHtmlUnsafe; // Get the name of the variable 
                                              // Where the HTML is stored

        $scope.$watch(htmlName, function( newHTML ) { // Watch for changes to 
                                                      // the HTML
            if(!newHTML) return;
            compile(newHTML);   // Compile it
        });

    };
});

//This turns an object to an array so I can use orderBy in ng-repeat
app.filter('object2Array', function() {
    return function(input) {
      var out = []; 
      for(i in input){
        out.push(input[i]);
      }
      return out;
    }
 });

app.factory('auth', ['$http', '$window', authFactory]);
app.factory('posts', ['$http', 'auth', postsFactory]);
app.controller('MainCtrl', ['posts', 'auth', MainCtrl]);
app.controller('PostsCtrl', ['posts', 'post', 'auth', PostsCtrl]);
app.controller('AuthCtrl', ['$scope', '$state', 'auth', AuthCtrl]);
app.controller('NavCtrl', ['$scope', 'auth', NavCtrl]);
