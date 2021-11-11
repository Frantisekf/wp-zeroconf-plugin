import { createPortal } from "react-dom";

const Control = (props) => {
    return createPortal(props.children, document.getElementById(props.element));
}

export default Control;