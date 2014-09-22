
angular.module('App', [])
    .controller('Login', ['$scope', "$http", function ($scope, $http) {
        $scope.greetMe = 'World';
        $scope.credentials = {
            login: "",
            password: "",
            rememberMe: false
        };

        $scope.tryLogin = function() {
            console.log("trying", $scope.credentials);
            $http({method: "POST", url: "/api/users/login", data:$scope.credentials, cache: false}).
              success(function(data,status,headers,config) {
                console.log("success", data, status, headers,config);
            }).error(function(data,status,headers,config){
                console.log("error", data, status, headers,config);
            });
        };;

    }]);