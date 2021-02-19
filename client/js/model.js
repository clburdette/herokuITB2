function updatePlayer(object)                                                                       //TODO create model object and put model in it
{
  object.xVec = Math.sin(object.angle);                                                             //calculate forward vector based on
  object.yVec = Math.cos(object.angle);                                                             //player character object's rotation
  object.FirePointX=object.xVec*object.scale;                                                       //calculate position of fire point
  object.FirePointY=object.yVec*object.scale*(-1);                                                  //based on forward vector    
  if(object.xVel != 0){object.xVel*=0.99;}                                                          //friction
  if(object.yVel != 0){object.yVel*=0.99;}
  object.yVel += 0.003;                                                                             //effect of blood flow on players
  var speedRatio = ((object.xVel*object.xVel)+(object.yVel*object.yVel))/object.MAX_MAG;
  if(speedRatio>1)                                                                                  //cap forward speed to MAX_MAG
  {
    object.xVel/=speedRatio;
    object.yVel/=speedRatio;
  }
  object.xPos+=object.xVel;                                                                         //position updated by velocity
  object.yPos+=object.yVel;
  if(object.xPos<object.scale)                                                                      //keeps player object in the play area
  {
    object.xPos=object.scale;
    object.xVel*=-0.5;
  }
  if(object.xPos>1024-object.scale)
  {
    object.xPos=1024-object.scale;
    object.xVel*=-0.5;
  }
  if(object.yPos<object.scale)
  {
    object.yPos=object.scale;
    object.yVel*=-0.5;
  }
  if(object.yPos>768-object.scale)
  {
    object.yPos=768-object.scale;
    object.yVel*=-0.5;
  }
}