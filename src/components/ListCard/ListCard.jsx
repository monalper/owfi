import React from 'react';
import { Link } from 'react-router-dom';
import { TbArrowRight } from 'react-icons/tb';
import './ListCard.css';

function ListCard({ to, icon, iconImage, title }) {
  return (
    <Link to={to} className="list-card-root">
      <div className="list-card-icon-wrapper">
        {iconImage ? (
          <img
            src={iconImage}
            alt=""
            className="list-card-icon-image"
            aria-hidden="true"
          />
        ) : (
          <span className="list-card-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="list-card-title">{title}</div>
      <TbArrowRight className="list-card-arrow" />
    </Link>
  );
}

export default ListCard;
