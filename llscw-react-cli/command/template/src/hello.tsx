import * as React from "react";

interface Props {
  userName: string;
}

export const HelloComponent: React.FC<Props> = (props) => {
    React.useEffect(()=>{
        console.log('测试数据')
    })
  return <h2>Hello user: {props.userName} !</h2>;
};