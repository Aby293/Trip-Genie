import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import Login from './components/login.jsx';
import SellerList from './components/SellerList.jsx';
import ActivityList from './components/ActivityList.jsx';
import ItineraryList from './components/ItineraryList.jsx';
import HistoricalPlaceList from './components/HistoricalPlaceList.jsx';
import Hero from './components/Hero.jsx';


function App() {
  return (
    <div className="App">
      <Router>
      <Navbar/> 
      <Hero/> 

      {/* {isLoginPage ? null : <Navbar />} */}
      <div className='pages'>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/seller' element={<SellerList />} />
            <Route path = '/activity' element = {<ActivityList/>}/>
            <Route path = '/iteneraries' element = {<ItineraryList/>}/>
            <Route path = '/museums' element = {<HistoricalPlaceList/>}/>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
