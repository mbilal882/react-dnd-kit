// import { useState } from "react";
// import { closestCenter, DndContext } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import "./App.css"
// import { CSS } from "@dnd-kit/utilities";

// const data = [
//   {
//     id: 1,
//     name: "Samaria",
//   },
//   {
//     id: 2,
//     name: "Gauthier",
//   },
//   {
//     id: 3,
//     name: "Mellisa",
//   },
//   {
//     id: 4,
//     name: "Arabela",
//   },
//   {
//     id: 5,
//     name: "Devon",
//   },
// ];

// const SortableUser = ({ user }) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//   } = useSortable({ id: user.id });
//   const style = {
//     transition,
//     transform: CSS.Transform.toString(transform),
//     padding: "5px",
//     width: "300px",
//     backgroundColor: "#ff2300",
//     marginBottom: "5px",
//     color: "white",
//     borderRadius: "10px"
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className="user"
//     >
//       <button {...listeners} {...attributes} >Drag</button>
//       {user.name}
//     </div>
//     // <div
//     //   ref={setNodeRef}
//     //   style={style}
//     //   className="user"
//     //   {...listeners}
//     //   {...attributes}
//     // >
//     //   {user.name}
//     // </div>
//   );
// };

// const App = () => {
//   const [users, setUsers] = useState(data);

//   const onDragEnd = (event) => {
//     const { active, over } = event;
//     if (active.id === over.id) {
//       return;
//     }
//     setUsers((users) => {
//       const oldIndex = users.findIndex((user) => user.id === active.id);
//       const newIndex = users.findIndex((user) => user.id === over.id);
//       console.log('Dragged Item', users[oldIndex])
//       console.log('Drop at Item', users[newIndex])
//       return arrayMove(users, oldIndex, newIndex);
//     });
//   };

//   return (
//     <div className="users">
//       <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
//         <SortableContext items={users} strategy={verticalListSortingStrategy}>
//           {users.map((user) => (
//             <SortableUser key={user.id} user={user} />
//           ))}
//         </SortableContext>
//       </DndContext>
//     </div>
//   );
// };
// export default App;

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import Container from "./container";
import { Item } from "./sortable_item";

const wrapperStyle = {
  display: "flex",
  flexDirection: "row"
};

const defaultAnnouncements = {
  onDragStart(id) {
    console.log(`Picked up draggable item ${id}.`);
  },
  onDragOver(id, overId) {
    if (overId) {
      console.log(
        `Draggable item ${id} was moved over droppable area ${overId}.`
      );
      return;
    }

    console.log(`Draggable item ${id} is no longer over a droppable area.`);
  },
  onDragEnd(id, overId) {
    if (overId) {
      console.log(
        `Draggable item ${id} was dropped over droppable area ${overId}`
      );
      return;
    }

    console.log(`Draggable item ${id} was dropped.`);
  },
  onDragCancel(id) {
    console.log(`Dragging was cancelled. Draggable item ${id} was dropped.`);
  }
};

export default function App() {
  const [items, setItems] = useState({
    root: ["1", "2", "3"],
    container1: ["4", "5", "6"],
    container2: ["7", "8", "9"],
    container3: []
  });
  const [activeId, setActiveId] = useState();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <div style={wrapperStyle}>
      <DndContext
        announcements={defaultAnnouncements}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Container id="root" items={items.root} />
        <Container id="container1" items={items.container1} />
        <Container id="container2" items={items.container2} />
        <Container id="container3" items={items.container3} />
        <DragOverlay>{activeId ? <Item id={activeId} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );

  function findContainer(id) {
    if (id in items) {
      return id;
    }

    return Object.keys(items).find((key) => items[key].includes(id));
  }

  function handleDragStart(event) {
    const { active } = event;
    const { id } = active;

    setActiveId(id);
  }

  function handleDragOver(event) {
    const { active, over, draggingRect } = event;
    const { id } = active;
    const { id: overId } = over;

    // Find the containers
    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      // Find the indexes for the items
      const activeIndex = activeItems.indexOf(id);
      const overIndex = overItems.indexOf(overId);

      let newIndex;
      if (overId in prev) {
        // We're at the root droppable of a container
        newIndex = overItems.length + 1;
      } else {
        const isBelowLastItem =
          over &&
          overIndex === overItems.length - 1 &&
          draggingRect.offsetTop > over.rect.offsetTop + over.rect.height;

        const modifier = isBelowLastItem ? 1 : 0;

        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter((item) => item !== active.id)
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          items[activeContainer][activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length)
        ]
      };
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const { id } = active;
    const { id: overId } = over;

    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer !== overContainer
    ) {
      return;
    }

    const activeIndex = items[activeContainer].indexOf(active.id);
    const overIndex = items[overContainer].indexOf(overId);

    if (activeIndex !== overIndex) {
      setItems((items) => ({
        ...items,
        [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex)
      }));
    }

    setActiveId(null);
  }
}
