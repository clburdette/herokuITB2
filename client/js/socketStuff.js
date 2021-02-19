var socket = io();

  socket.on("gameStarted", function(){                                                                  //Start game loop on client when signal received from server that the game is
    serverAccept = true;                                                                                //running on the server
    initGame();
  });

  socket.on("twoPlayerSessionStarted", function(){                                                      //acknowledges that a 2-player session has started on the server and puts
    server2init = true;                                                                                 //client into a wait state until 2nd player is available
    document.getElementById("parent").innerHTML = "game session started. waiting for 2nd player";
  });

  socket.on("twoPlayerGameStarted", function(){                                                         //acknowledges that a 2-player game is running in the previous started 2-player
    serverAccept2 = true;                                                                               //session.  Beings game loop on client.
    initGame()
  });

  socket.on("serverFull", function(){                                                                   //Server capacity is preliminarily set at 10 sockets.  This signal lets the client know
    document.getElementById("parent").innerHTML = "server full. please wait for game to start";         //that the server is at capacity and puts the client in a wait state.  Wait state will
    requestGameStart();                                                                                 //continually ping the server to check for openings until there is one.
  });

  socket.on("serverFull2", function(){
    document.getElementById("parent").innerHTML = "server full. please wait for game to start";         //Similar to serverFull above, but for 2-player sessions     
    requestTwoPlayerGameStart();
  });

  socket.on("sessionHostDropped", function(){                                                           //signal to client if the 2-player session host has disconnected mid-game
    serverAccept2 = false;                                                                              //puts the client in an end game state, and enables the client to start a new game  
    clearInterval(myInterval);
    console.log("game over socket:" + socket.id);
    postGame();
  });

  socket.on("sessionAbandoned", function(){                                                             //signal to client if the player in a 2-player session that is not hosting has disconnected mid-game
    serverAccept2 = false;                                                                              //puts the client in an end game state, and enables the client to start a new game
    clearInterval(myInterval);
    console.log("game over socket:" + socket.id);
    postGame();
  });

  socket.on('playerLayer', function(data){                                                            //controls what the client does when a playerLayer package has arrived from the server
    if(data)
    {
      playerObjects = data;                                                                           //overwrites playerObjects array with new data and sets client player variable appropriately
      player = playerObjects[0];
      if(serverAccept2){player2 = playerObjects[1];}
      playerLayerReceived = true;
    }
    else{playerLayerReceived = false;}
  });

  socket.on('objectLayers', function(data){                                                           //controls what the client does when a objectLayers package has arrived from the server
    if(data)
    {
      layerObjects = data;                                                                            //overwrites layerObjects array with new data
      objectLayerReceived = true;
    }
    else{objectLayerReceived = false;}
  });

  socket.on('viewLayer', function(data){                                                              //controls what the client does when a viewLayer package has arrived from the server
    if(data)
    {
      view.playerScore = data.playerScore;                                                            //updates view layer variables with new information from the server
      view.multiplier = data.multiplier;
      patientHealth = data.patientHealth;
    }
    else{console.log("no view layer data in package");}
  });

  socket.on('gameOver', function(){                                                                   //tells the client what to do when it has received a signal from the server that the current
    clearInterval(myInterval);                                                                        //game session on the server has ended
    console.log("game over socket:" + socket.id);
    postGame();
  });

  var signDiv = document.getElementById("signDiv");                                                  //sign in and sign up screen           
  var signDivUsername = document.getElementById("signDiv-username");
  var signDivSignIn = document.getElementById("signDiv-signIn");
  var signDivSignUp = document.getElementById("signDiv-signUp");
  var signDivPassword = document.getElementById("signDiv-password");

  signDivSignIn.onclick = function(){                                                                //handles sign in data and sends it to the server if applicable 
    if(isValidFormInput(signDivUsername.value) && isValidFormInput(signDivPassword.value))
    {
      document.getElementById("errorMessage").innerHTML = "";
      socket.emit('signIn', {
        username : signDivUsername.value,
        password : signDivPassword.value});
    }
    else
    {
      document.getElementById("errorMessage").innerHTML = "user name and/or password must be at least 4 characters in length";
    }
  };

  function isValidFormInput(data)                                                                    //super simple format check. will update to much more stringent regex checks in later versions.
  {
      return data.length >= 4;
  }

  signDivSignUp.onclick = function(){                                                               //handles sign up data and sends it to the server if applicable
    socket.emit('signUp', {
      username : signDivUsername.value,
      password : signDivPassword.value});
  };

  socket.on('signInResponse', function(data){                                                       //handles response from server concerning the sign in data
    if(data.success){
      signDiv.innerHTML = "";
      init();
    }
    else 
    {
      document.getElementById("errorMessage").innerHTML = "user name and/or password are not valid";
    }
  });

  socket.on('signUpResponse', function(data){                                                       //handles response from server concerning the sign in data
    if(data.success)                                                                                //currently a bug here where sign up success message does not display
    {
      document.getElementById("errorMessage").innerHTML = "please sign in with your newly created user name and password";
    }
    else
    {
      document.getElementById("errorMessage").innerHTML = "user name is not available. try another.";
    }
  });