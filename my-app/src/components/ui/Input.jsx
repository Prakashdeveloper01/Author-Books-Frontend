import React, { useState } from 'react';
import './Input.css';

const Input = ({ label, id, error, icon: Icon, className = '', ...props }) => {
    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}

            <div className="input-wrapper">
                <input
                    id={id}
                    className="input-field"
                    {...props}
                />
                {/* No icons inside input for strict professional look, unless error/valid state needed later */}
            </div>
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
};

export default Input;
