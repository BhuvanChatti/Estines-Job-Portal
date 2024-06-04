import React from 'react';

const InputFrom = ({htmlFor, labelText, type, name, value, handleChange}) => {
    
    return (
        <div>
            <>
                <div className="mb-3">
                    <label htmlFor={htmlFor} className="form-label">{labelText}</label>
                    <input type={type} className="form-control" name={name} value={value} onChange={handleChange} />
                </div>
            </>
        </div>
    )
};
export default InputFrom