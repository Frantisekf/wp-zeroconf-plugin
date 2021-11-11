import './App.css';
import React from 'react';
import Discovery from './Discovery/Discovery';
import SpatialNavigation from 'react-js-spatial-navigation';


function App() {
  const hideMenuHandler = (event, key = true) => {
    const keys = [8, 27, 403, 461];
    if (keys.includes(event.keyCode) || key === false){
      window.history.back();
    }
  }
  return (
    <div className="App">
      <SpatialNavigation className="App">
        <Discovery hideMenu={hideMenuHandler}/>
      </SpatialNavigation>
    </div>
  );
}

export default App;
