import React from 'react';
import '../../src/styles/Home.css';
import TopMenuBar from './TopMenuBar';
const HomePage = () => {
    return (
        <>
            <TopMenuBar />
            <div className="backgroundStyle">
                <div className="overlay"></div>
                <div className="content">
                    <img src="/assets/images/logo-no-background.png" alt="logo" style={{ width: '250px', height: '80px' }}></img>
                    <h1>Welcome to Job Board</h1>
                    <p>
                        Search and manage your jobs with ease.
                    </p>
                </div>
            </div>
            
        </>
    );
};

export default HomePage;