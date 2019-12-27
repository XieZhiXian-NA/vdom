// 名字，属性，子元素
const vnodeType = {
  HTML: "HTML",
  TEXT: "TEXT",
  CONPONENT: "CONMPONENT",
  CLASS_COMPONENT: "CLASS_COMPONENT"
};
const childType = {
  EMPTY: "EMPTY",
  SINGLE: "SINGLE",
  MULTIPLE: "MULTIPLE"
};
function createElement(tag, data, children) {
  let flag;
  if (typeof tag === "string") {
    //普通的html标签
    flag = vnodeType.HTML;
  } else {
    flag = vnodeType.TEXT;
  }
  let childrenFlag;
  if (children == null) {
    childrenFlag = childType.EMPTY;
  } else if (Array.isArray(children)) {
    let length = children.length;
    if (length == 0) {
      childrenFlag = childType.EMPTY;
    } else {
      childrenFlag = childType.MULTIPLE;
    }
  } else {
    //文本
    childrenFlag = childType.SINGLE;
    children = createTextVnode(children);
  }
  return {
    el: null,
    flag, //vnode类型 div conponent
    tag, //文本没有tag 组件就是函数
    data,
    key: data && data.key,
    children,
    childrenFlag
  };
}
function createTextVnode(text) {
  return {
    el: null,
    flag: vnodeType.TEXT,
    tag: null,
    children: text,
    chilrenFlag: childType.EMPTY
  };
}
function render(vnode, container) {
  //区分首次渲染和再次渲染
  if (container.vnode) {
    //更新 老的节点，新的节点, 容器
    patch(container.vnode, vnode, container);
  } else {
    //首次挂载
    mount(vnode, container);
  }

  container.vnode = vnode;
}

//打补丁 新元素与老元素
function patch(prev, next, container) {
  let nextFlag = next.flag;
  let prevFlag = prev.flag;
  //类型不一样 直接替换
  if (nextFlag != prevFlag) {
    replaceVnode(prev, next, container);
  } else if (nextFlag == vnodeType.HTML) {
    patchElement(prev, next, container);
  } else if (nextFlag == vnodeType.TEXT) {
    patchText(prev, next);
  }
}
function replaceVnode(prev, next, container) {
  container.removeChild(prev.el);
  mount(next, container);
}
function patchElement(prev, next, container) {
  if (prev.tag !== next.tag) {
    replaceVnode(prev, next, container);
    return;
  }
  //1:说明他们是同一种HTML 如div
  //2:将老元素在页面中的id赋值给新的el，有元素来挂载新的div
  //3:挂载新的data属性
  let el = (next.el = prev.el);
  let prevData = prev.data;
  let nextData = next.data;
  //给el的data进行更新和新建
  if (nextData) {
    for (let key in nextData) {
      let prevVal = prevData[key];
      let nextVal = nextData[key];
      patchData(el, key, prevVal, nextVal);
    }
  }
  //el的旧的data删除
  if (prevData) {
    for (let key in prevData) {
      let prevVal = prevData[key];
      if (prevVal && !nextData.hasOwnProperty(key)) {
        patchData(el, key, prevVal, null);
      }
    }
  } //data更新完毕

  //更新子元素
  patchChildren(
    prev.childrenFlag,
    next.childrenFlag,
    prev.children,
    next.children,
    el
  );
}
function patchText(prev, next) {
  //更新nodevalue
  let el = (next.el = prev.el);
  if (next.children !== prev.children) {
    el.nodeValue = next.children;
  }
}
//首次挂载元素
function mount(vnode, container, flagNode) {
  let { flag } = vnode;
  if (flag == vnodeType.HTML) {
    mountElement(vnode, container, flagNode);
  } else if (flag == vnodeType.TEXT) {
    mountText(vnode, container);
  }
}
function mountElement(vnode, container, flagNode) {
  let dom = document.createElement(vnode.tag);
  vnode.el = dom;
  let { data, children, childrenFlag } = vnode;
  //挂载data属性
  if (data) {
    for (let key in data) {
      //节点，名字，老值，新值
      patchData(dom, key, null, data[key]);
    }
  }

  if (childrenFlag != childType.EMPTY) {
    if (childrenFlag == childType.SINGLE) {
      mount(children, dom);
    } else if (childrenFlag == childType.MULTIPLE) {
      for (let i = 0; i < children.length; i++) {
        mount(children[i], dom);
      }
    }
  }
  flagNode ? container.insertBefore(dom, flagNode) : container.appendChild(dom);
}
//挂载data属性值
function patchData(el, key, prv, next) {
  switch (key) {
    case "style":
      for (let key in next) {
        el.style[key] = next[key];
      }
      //删除旧的属性
      for (let key in prv) {
        if (!next.hasOwnProperty) {
          el.style[key] = "";
        }
      }
      break;
    case "class":
      el.className = next;
      break;
    default:
      if (key[0] === "@") {
        if (prv) {
          el.removeEventListener(key.slice(1), prv);
        }
        if (next) {
          el.addEventListener(key.slice(1), next);
        }
      } else {
        //设置key:'a'
        el.setAttribute(key, next);
      }
  }
}
function mountText(vnode, container) {
  let dom = document.createTextNode(vnode.children);
  vnode.el = dom;
  container.appendChild(dom);
}
function patchChildren(
  prevChildrenFlag,
  nextChildrenFlag,
  prevChildren,
  nextChildren,
  container
) {
  //更新子元素
  //1.老的孩子是单独的，空的，多个
  //2.新的是单独的，空的，多个
  switch (prevChildrenFlag) {
    case childType.SINGLE:
      switch (nextChildrenFlag) {
        case childType.SINGLE:
          patch(prevChildren, nextChildren, container);
          break;
        case childType.EMPTY:
          container.removeChild(prevChildren.el);
          break;
        case childType.MULTIPLE:
          container.removeChild(prevChildren.el);
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }

          break;
      }
      break;
    case childType.EMPTY:
      switch (nextChildrenFlag) {
        case childType.SINGLE:
          mount(nextChildren, container);
          break;
        case childType.EMPTY:
          break;
        case childType.MULTIPLE:
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
    case childType.MULTIPLE:
      switch (nextChildrenFlag) {
        case childType.SINGLE:
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChildren(prevChildren[i].el);
          }
          mount(nextChildren, container);
          break;
        case childType.EMPTY:
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChildren(prevChildren[i].el);
          }
          break;
        case childType.MULTIPLE:
          //众多虚拟dom
          // 老的是个数组，新的也是个数组
          //老的是[abc]
          //   1:新的是abc 拿新的元素去老的数组里面查找对应的下标是012 递增 不修改
          //   2:新的是cab 拿新的元素去老的数组里面查找对应的下标是20 不递增 就要修改新的是[cab]
          //   3:新的是feaxxbxxc 拿新的元素去老的数组里面查找，abc的相对位置不变，则只需插入
          //   4:新的是
          let lastIndex = 0;
          console.log(container);
          for (let i = 0; i < nextChildren.length; i++) {
            let nextVnode = nextChildren[i];
            let j = 0;
            let find = false;
            for (j; j < prevChildren.length; j++) {
              let preVnode = prevChildren[j];
              if (preVnode.key === nextVnode.key) {
                find = true;
                //key相同，则认为是同一个元素,直接打补丁
                patch(preVnode, nextVnode, container);
                //如果此次j的值比上一次查找到的值小，则说明在新的数组中，发生了顺序的移动
                if (j < lastIndex) {
                  //需要移动 insertBefor移动元素
                  //abc a想移动到bc之后，abc的父元素insertBefore(b的下一个元素)
                  //nextSibling返回某个元素之后紧跟的节点,以对象的形式返回
                  let flagNode = nextChildren[i - 1].el.nextSibling;

                  //insertBefore() 方法可在已有的子节点前插入一个新的子节点。
                  container.insertBefore(preVnode.el, flagNode);

                  break;
                } else {
                  lastIndex = j;
                }
              }
            }
            if (!find) {
              //需要新增的
              let flagNode =
                i == 0
                  ? prevChildren[0].el
                  : nextChildren[i - 1].el.nextSibling;
              mount(nextVnode, container, flagNode);
            }
          }
          //移除不需要的元素;
          for (let i = 0; i < prevChildren.length; i++) {
            const prevVnode = prevChildren[i];
            const has = nextChildren.find(next => next.key === prevVnode.key);
            if (!has) {
              container.removeChild(prevVnode.el);
            }
          }
          break;
      }
      //移除不需要的元素
      break;
  }
}
