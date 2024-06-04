import React from 'react';
import { Link } from 'react-router-dom';
import './TopMenuBar.css';
import '../../src/styles/Home.css';

const TopMenuBar = () => {
    return (
        <div className="top-menu-bar text-center">
            <div className="menu-items">
                <Link to="/" className="menu-item">Home</Link>
                <Link to="/jobs" className="menu-item">Jobs</Link>
                <Link to="/dashboard" className="menu-item">Dashboard</Link>
                <Link to="/search" className="menu-item">Search</Link>
            </div>
            <div className="auth-buttons">
                <Link to="/login">
                    <button className="button">Login</button>
                </Link>
                <Link to="/register">
                    <button className="button">Register</button>
                </Link>
            </div>
        </div>
    );
};

export default TopMenuBar;
