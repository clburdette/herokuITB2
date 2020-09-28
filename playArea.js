var playArea = {

makeCanvasTags : function(amount)                          //create string containing all HTML canvas tags for placement in parent div tag
{
  var temp = '';                                           //first canvas tag is a plain red background and no game objects are drawn onto it  
  temp += '<canvas id="canvas0" width="1024" height="768" style="border:1px solid lightgrey; background-color:red; position:absolute; left:0px; top:0px; z-index:1;"></canvas>';

  for(var i=0; i < amount; i++)                            //loop to create various layers that the game objects are drawn onto 
  {                                                        //all backgrounds are transparent to create illusion that player is viewing down into the background layer
    temp += '<canvas id="' + 'canvas' + (i+1).toString() + '" width="1024" height="768" style="border:1px solid lightgrey; background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (i+2).toString() + ';"></canvas>"';
  }
  temp += '<canvas id="weapons" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+2).toString() +';"></canvas>"';
  temp += '<canvas id="player" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+3).toString() +';"></canvas>"';
  temp += '<canvas id="UI" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+4).toString() +';"></canvas>"';

  document.getElementById("parent").innerHTML = temp;      //last 3 canvases are for player emitted projectiles, player character object(s), and user interface respectively
}                                                          //TODO rename weapons canvas to projectiles for sake of continuity
,      
makeCanvases : function(amount)                            //fills the array that will hold the canvas documents with temp variables
{                                                          //TODO refactor amount parameter on these functions into something more meaningful
  for(var i=0; i < amount; i++)
  {
    var temp;
    canvasBag[i] = temp;
  }
}
,
makeContexts : function(amount)                            //fills the array that will hold the canvas contexts with temp variables
{
  for(var i=0; i < amount; i++)
  {
    var temp;
    contextBag[i] = temp;
  }
}
,
linkContexts : function(amount)                            //places canvas documents into the canvasBag array
{                                                          //so they can be accessed later, gets contexts from
  for(var i=0; i < amount; i++)                            //the canvas documents, and places them into the
  {                                                        //contextBag array so they can be accessed later 
    var temp = "canvas" + (i+1).toString();
    canvasBag[i] = document.getElementById(temp);
    contextBag[i] = canvasBag[i].getContext('2d');
  }
}
,
makeLayers : function(amount)                              //fills the canvasObjects array with empty arrays that will be
{                                                          //used to hold dynamically created game objects
  for(var i=0; i < amount; i++)
  {
    var temp = [];
    canvasObjects.push(temp);
  }
}
,
clearCanvases : function()                                 //clears last frame's information from each canvas context 
{
  for(i=0; i < contextBag.length; i++)
  {
    contextBag[i].clearRect(0,0,canvasBag[i].width,canvasBag[i].height);
  }
  playArea.weaponsContext.clearRect(0,0,playArea.weaponsCanvas.width,playArea.weaponsCanvas.height);
  playArea.playerContext.clearRect(0,0,playArea.playerCanvas.width,playArea.playerCanvas.height);
  view.uiContext.clearRect(0,0,view.uiCanvas.width,view.uiCanvas.height);
}
,
makePlayerLayer : function()
{
  playArea.playerCanvas = document.getElementById("player");         //creates player canvas, context          
  playArea.playerContext = playArea.playerCanvas.getContext('2d');
}
,
makeWeaponsLayer : function()
{
  playArea.weaponsCanvas = document.getElementById("weapons");       //creates weapons canvas, context
  playArea.weaponsContext = playArea.weaponsCanvas.getContext('2d');
}
};                                                        //updated from CSE322 to use for CSE4050
