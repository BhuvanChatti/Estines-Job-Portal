import React from 'react'
import '../../styles/Layout.css'
import { userMenu } from './Menu/userMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
const Layout = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate();
    const sidebarMenu = userMenu;
    const { user } = useSelector(state => state.auth);
    const fullName = user ? `${user.name || ''} ${user.lastName || ''}`.trim() : 'Guest';
    const handleLogout = () => {
        localStorage.clear()
        toast.success('Logged out successfully')
        navigate("/login")
    }
    return (
        <>
            <div className='row'>
                <div className='col-md-3 sidebar'>Menu
                    <div className='logo'>
                        <h6>Job Board</h6>
                    </div>
                    <hr />

                    <p className='text-center text' >Welcome : {fullName}</p>
                    <div className='menu text-center'>
                        {sidebarMenu.map(menu => {
                            const isActive = location.pathname === menu.path
                            return (
                                <div className={`menu-item ${isActive && "active"}`}>
                                    <i className={menu.icon}></i>
                                    <Link to={menu.path}>{menu.name}</Link>
                                </div>
                            )
                        })}
                        < div className={`menu-item `} onClick={handleLogout}>
                            <i className="fa-solid fa-right-to-bracket"></i>
                            <Link to="/login">Logout</Link>
                        </div>
                    </div>
                </div>
                <div className='col-md-9'>{children}</div>
            </div>
        </>
    )
}

export default Layout