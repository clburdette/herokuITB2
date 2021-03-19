function gameLoop(){
  if(!gamePaused)
  {                                                                                               //which recursively called a client function.  Needed to abandon that so that I could move the game 
    if(!mouseDownCheck)                                                                           //loop to the server to facilitate multiplayer games
    { pressedKeys["m"] = false; }                                                                 //mouse check constrains mouse clicks to the update loop, allowing no more than one projectile
    socket.emit('playerInput', pressedKeys);                                                      //fired per frame
    mouseDownCheck = false;
    playArea.weaponsContext.clearRect(0,0,playArea.weaponsCanvas.width,playArea.weaponsCanvas.height);  //clear "special" canvas to ready for update during current frame
    playArea.playerContext.clearRect(0,0,playArea.playerCanvas.width,playArea.playerCanvas.height);
    playArea.player2Context.clearRect(0,0,playArea.player2Canvas.width,playArea.player2Canvas.height);
    if(!playerLayerReceived && player != null)                                                                      //checks for reception of package from server.  If missed, the client recalculates positions of
    {                                                                                             //various objects based on the previous frame's information.  Meant to fill in very short gaps
      console.log(player);
      var i = 1;                                                                                  //caused by occasional latency to and from server.
      if(!server2init && serverAccept2){handleInput(player2);}                                    
      else{handleInput(player);}
      updatePlayer(player);
      if(serverAccept2 && player2 != null)
      {
        updatePlayer(player2);
        i = 2;
      }
      for(i; i < playerObjects.length; i++)
      {
        playerObjects[i].xPos += playerObjects[i].xVel*intervalTime/1000;        
        playerObjects[i].yPos += playerObjects[i].yVel*intervalTime/1000;
      }
      console.log("client side player update");
    }
    playerLayerReceived = false;
    if(!objectLayerReceived)
    {
      for(var i = 0; i < layerObjects.length; i++)
      {
        if(layerObjects[i].xVel != 0){layerObjects[i].xVel*=0.999;}                                            
        if(layerObjects[i].yVel != 0){layerObjects[i].yVel*=0.999;}
        if(layerObjects[i].zVel != 0){layerObjects[i].zVel*=0.999;}	
        layerObjects[i].yVel += 0.1;                                                                
        layerObjects[i].xPos += layerObjects[i].xVel*intervalTime/1000;                                                  
        layerObjects[i].yPos += layerObjects[i].yVel*intervalTime/1000;                                                  
        layerObjects[i].zPos += layerObjects[i].zVel*intervalTime/1000;
      }
    }
    objectLayerReceived = false;
    if(!viewLayerReceived)
    {
      view.ticks++;
    }
    viewLayerReceived = false;
    view.drawPlayer(playArea.playerContext, player);                                                  //draw player(s) and player projectiles based on most current player information
    var m = 1;
    if(serverAccept2)
    {
      view.drawPlayer(playArea.player2Context, player2);
      m = 2;
    }
    for(m; m < playerObjects.length; m++)                   
    {
      playArea.weaponsContext.fillStyle = '#000000';                  
      playArea.weaponsContext.beginPath();
      playArea.weaponsContext.arc(playerObjects[m].xPos, playerObjects[m].yPos, playerObjects[m].scale, 0, 2*Math.PI);     
      playArea.weaponsContext.fill();
    }                    

    for(var i = 0; i < contextBag.length; i++)                                                   //clears gameplay object canvas contexts for current frame update
    {
      contextBag[i].clearRect(0,0,canvasBag[i].width,canvasBag[i].height);
    }
    for(var i=0; i < layerObjects.length; i++)                                                   //draw gameplay objects based on most current information
    {
      var group = layerObjects[i];
      for(var j=0; j < group.length; j++)
      {
        if(i == [numCanvases-1])                                        
        {
          contextBag[i].fillStyle = '#440033';
        }
        else
        {
          var num = (256/numCanvases)*(16-i);                                                     //non-player objects are purple when they are on the same canvas as the player(s) and can collide
          var color = '#' + num.toString(16) + '0000';                                            //with them.  The rest are various shades of red determined by the layer they reside on 
          contextBag[i].fillStyle = color;                                                         
        }
        contextBag[i].beginPath();                                                                //draw circle representing blood vessel in blood stream                         
        contextBag[i].arc(group[j].xPos, group[j].yPos, group[j].scale, 0, 2*Math.PI);
        contextBag[i].fill();
      }
    }
    view.uiContext.clearRect(0,0,view.uiCanvas.width,view.uiCanvas.height);                       //clear and update UI
    view.updateUI();
    playerLayerReceived = false;
    objectLayerReceived = false;
  }
}
