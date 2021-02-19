function handleInput(targetplayer)                                                                  //translates input data to a keyword pair object that can be sent to the server
{
  if(!pressedKeys || pressedKeys == null)
  { 
    pressedKeys = {"a":false,"d":false,"s":false, "w":false, "m":false}; 
  }
  if(pressedKeys["a"]&&pressedKeys["d"]&&pressedKeys["w"])                                          //forward no rotation when a,d,w pressed
  {
    targetplayer.xVel += 0.01*targetplayer.FirePointX;
    targetplayer.yVel += 0.01*targetplayer.FirePointY;    
  }
  else if(pressedKeys["a"]&&pressedKeys["w"])                                                       //forward and rotate left when a,w pressed
  {
    targetplayer.angle -= 0.05;
    targetplayer.xVel += 0.01*targetplayer.FirePointX;
    targetplayer.yVel += 0.01*targetplayer.FirePointY; 
  }                                 
  else if(pressedKeys["d"]&&pressedKeys["w"])                                                       //forward and rotate right when d,w, pressed
  {
    targetplayer.angle += 0.05;
    targetplayer.xVel += 0.01*targetplayer.FirePointX;
    targetplayer.yVel += 0.01*targetplayer.FirePointY;
  }
  else if(pressedKeys["a"]&&pressedKeys["s"])                                                       //backward and rotate left when a,s, pressed
  {
    targetplayer.angle -= -0.02;
    targetplayer.xVel -= 0.001*targetplayer.FirePointX;
    targetplayer.yVel -= 0.001*targetplayer.FirePointY;
  }                                                       
  else if(pressedKeys["d"]&&pressedKeys["s"])                                                       //backward and rotate right when d,s, pressed
  {
    targetplayer.angle += 0.02;
    targetplayer.xVel += 0.001*targetplayer.FirePointX;
    targetplayer.yVel += 0.001*targetplayer.FirePointY; 
  }                                                       
  else if(pressedKeys["a"])                                                                         //rotate left when a only pressed
  {
    targetplayer.angle -= 0.1;
  }
  else if(pressedKeys["d"])                                                                         //rotate right when d only pressed
  {
    targetplayer.angle += 0.1;
  }
  else if(pressedKeys["s"])                                                                         //backward when s only pressed
  {
    targetplayer.xVel -= 0.001*targetplayer.FirePointX;
    targetplayer.yVel -= 0.001*targetplayer.FirePointY;               
  }
  else if(pressedKeys["w"])                                                                         //forward when w only pressed
  {
    targetplayer.xVel += 0.01*targetplayer.FirePointX;
    targetplayer.yVel += 0.01*targetplayer.FirePointY;             
  }
}

function keyUpHandler(e)                                                                            //tracks when certain keys are not pressed
{                                                        
  if(!(gamePaused || e.key == "Escape"))
  {
    if(e.key == "a"){ pressedKeys["a"] = false; }
    else if(e.key == "d"){ pressedKeys["d"] = false; }
    else if(e.key == "s"){ pressedKeys["s"] = false; }
    else if(e.key == "w"){ pressedKeys["w"] = false; }
  }
}

function keyDownHandler(e)                                                                          //tracks when certain keys are pressed
{                                                        
  if(!(gamePaused || e.key == "Escape"))
  {
    if(e.key == "a"){ pressedKeys["a"] = true; }
    else if(e.key == "d"){ pressedKeys["d"] = true; }
    else if(e.key == "s"){ pressedKeys["s"] = true; }
    else if(e.key == "w"){ pressedKeys["w"] = true; }
  }
  else if(!gamePaused && e.key == "Escape")
  {
    view.displayPauseScreen();
    document.removeEventListener('mousedown', function(){pressedKeys["m"] = true; mouseDownCheck = true;}, false);        
    document.removeEventListener('mouseup', function(){pressedKeys["m"] = false;}, false);
    gamePaused = true;
    socket.emit("gamePaused");
    console.log("game paused client side"); 
  }
  keyDownCheck = true;                                                    
}