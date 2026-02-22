import React, { useState } from 'react';
import './Input.css';

const Input = ({ label, id, error, icon: Icon, rightElement, className = '', ...props }) => {
    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}

            <div className={`input-wrapper ${Icon ? 'has-icon' : ''}`}>
                {Icon && (
                    <div className="input-icon-left">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={id}
                    className={`input-field ${error ? 'input-error' : ''}`}
                    {...props}
                />
                {rightElement && (
                    <div className="input-element-right">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
};

export default Input;
