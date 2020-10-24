var controller = {                                                  //MOVE TO CLIENT
mouseDownHandler : function(){fire();}                              //CHANGE TO EMIT DATA RATHER THAN TRIGGER SERVER SIDE FUNCTION
,                                                                   //EVENT LISTENERS CURRENTLY IN GAME LOOP
keyUpHandler : function(e)                                          //manually tracks when certain keys are not pressed
{                                                        
  if(e.key == "a")                                                  //pressed keys array found in game loop. needs to be
  {                                                                 //moved to player object with everything else
    pressedKeys["a"] = false;
  }
  else if(e.key == "d")
  {
    pressedKeys["d"] = false;
  }
  else if(e.key == "s")
  {
    pressedKeys["s"] = false;
  }
  else if(e.key == "w")
  {
    pressedKeys["w"] = false;
  }
}
,
keyDownHandler : function(e)                                        //manually tracks when certain keys are pressed
{                                                        
  if(e.key == "a")
  {
    pressedKeys["a"] = true;
  }
  else if(e.key == "d")
  {
    pressedKeys["d"] = true;
  }
  else if(e.key == "s")
  {
    pressedKeys["s"] = true;
  }
  else if(e.key == "w")
  {
    pressedKeys["w"] = true;
  }                                                    
}
,
handleInput : function()                                           //KEEP ON SERVER SIDE IN CONTROLLER HANDLER, LOOP THROUGH EACH PLAYER
{
  if(pressedKeys["a"]&&pressedKeys["d"]&&pressedKeys["w"])         //forward no rotation when a,d,w pressed
  {
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY);    
  }
  else if(pressedKeys["a"]&&pressedKeys["w"])                      //forward and rotate left when a,w pressed
  {
    player.changeAngle(-0.05);
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY); 
  }                                 
  else if(pressedKeys["d"]&&pressedKeys["w"])                      //forward and rotate right when d,w, pressed
  {
    player.changeAngle(0.05);
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY);
  }
  else if(pressedKeys["a"]&&pressedKeys["s"])                     //backward and rotate left when a,s, pressed
  {
    player.changeAngle(-0.02);
    player.changeVel(-0.001*player.FirePointX,-0.001*player.FirePointY);
  }                                                       
  else if(pressedKeys["d"]&&pressedKeys["s"])                     //backward and rotate right when d,s, pressed
  {
    player.changeAngle(0.02);
    player.changeVel(0.001*player.FirePointX,0.001*player.FirePointY); 
  }                                                       
  else if(pressedKeys["a"])                                       //rotate left when a only pressed
  {
    player.changeAngle(-0.1);
  }
  else if(pressedKeys["d"])                                       //rotate right when d only pressed
  {
    player.changeAngle(0.1);
  }
  else if(pressedKeys["s"])                                       //backward when s only pressed
  {
    player.changeVel(-0.001*player.FirePointX,-0.001*player.FirePointY)               
  }
  else if(pressedKeys["w"])                                       //forward when w only pressed
  {
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY);               
  }
}
};                                                                //updated from CSE322 to use for CSE4050
