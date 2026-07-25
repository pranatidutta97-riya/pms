import "./BoxCards.css";

const BoxCards = ({title, value, subText, color, icon}) => {
    return ( 
        <div className="boxCard">
            <div className="card_left_info">
                <span className="card_title">{title}</span>
                {subText && <span className="card_subtext">{subText}</span>}
                <h2 className="card_value">{value}</h2>
            </div>
            <div className="card_right_icon" style={{ backgroundColor: `${color}15`, color: color }}>
                <i className={`fas ${icon}`}></i>
            </div>
        </div>
     );
};
 
export default BoxCards;