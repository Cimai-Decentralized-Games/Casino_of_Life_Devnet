import React from "react";
import { IconType } from "react-icons";

interface AIInfoCardProps {
  title: string;
  description: string;
  Icon: IconType;
  onClick?: () => void;
}

const AIInfoCard: React.FC<AIInfoCardProps> = ({ title, description, Icon, onClick }) => {
  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="card-body">
        <div className="flex items-center mb-4">
          <Icon className="text-4xl text-primary mr-2" />
          <h2 className="card-title">{title}</h2>
        </div>
        <p className="text-base-content">{description}</p>
        <div className="card-actions justify-end mt-4">
          <button 
            className="btn btn-primary" 
            onClick={onClick}
            // If onClick is not provided, the button will still be clickable due to the Link wrapper
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInfoCard;