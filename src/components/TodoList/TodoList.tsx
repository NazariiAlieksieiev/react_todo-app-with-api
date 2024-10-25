/* eslint-disable jsx-a11y/label-has-associated-control */

import { useEffect, useRef } from 'react';
import { Todo } from '../../types/Todo';
import cn from 'classNames';

interface Props {
  todos: Todo[];
  tempTodo: Todo | null;
  selectedTodoId: number[];
  isEditing: number | null;
  newTitle: string;
  onDelete: (value: number) => void;
  onToggle: (value: number, index: number) => void;
  onStartEditing: (value: string, id: number) => void;
  onNewTodoTitle: (value: string) => void;
  onChangeTodoTitle: (
    event: React.FormEvent,
    todo: Todo,
    index: number,
  ) => void;
  onKey: (event: React.KeyboardEvent) => void;
}

export const TodoList: React.FC<Props> = ({
  todos,
  tempTodo,
  selectedTodoId,
  isEditing,
  newTitle,
  onDelete,
  onToggle,
  onStartEditing,
  onNewTodoTitle,
  onChangeTodoTitle,
  onKey,
}) => {
  const newTitleFiled = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentField = newTitleFiled.current;

    if (currentField !== null) {
      currentField.focus();
    }
  }, [newTitleFiled, isEditing, todos]);

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map((todo, i) => (
        <div
          data-cy="Todo"
          className={cn('todo', { completed: todo.completed })}
          key={todo.id}
        >
          <label className="todo__status-label">
            <input
              data-cy="TodoStatus"
              data-todoId={todo.id}
              type="checkbox"
              className="todo__status"
              checked={todo.completed}
              onClick={() => onToggle(todo.id, i)}
            />
          </label>
          {isEditing === todo.id ? (
            <form onSubmit={event => onChangeTodoTitle(event, todo, i)}>
              <input
                data-cy="TodoTitleField"
                type="text"
                className="todo__title-field"
                placeholder="Empty todo will be deleted"
                value={newTitle}
                onChange={event => onNewTodoTitle(event?.target.value)}
                onBlur={event => onChangeTodoTitle(event, todo, i)}
                onKeyUp={onKey}
                ref={newTitleFiled}
              />
            </form>
          ) : (
            <>
              <span
                data-cy="TodoTitle"
                className="todo__title"
                onDoubleClick={() => onStartEditing(todo.title, todo.id)}
              >
                {todo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => onDelete(todo.id)}
              >
                ×
              </button>
            </>
          )}

          <div
            data-cy="TodoLoader"
            className={cn('modal overlay', {
              'is-active': selectedTodoId.includes(todo.id),
            })}
          >
            <div className="modal-background has-background-white-ter" />
            <div className="loader" />
          </div>
        </div>
      ))}

      {tempTodo && (
        <div data-cy="Todo" className="todo">
          <label className="todo__status-label">
            <input
              data-cy="TodoStatus"
              type="checkbox"
              className="todo__status"
            />
          </label>

          <span data-cy="TodoTitle" className="todo__title">
            {tempTodo.title}
          </span>

          <button type="button" className="todo__remove" data-cy="TodoDelete">
            ×
          </button>

          <div data-cy="TodoLoader" className="modal overlay is-active">
            <div className="modal-background has-background-white-ter" />
            <div className="loader" />
          </div>
        </div>
      )}
    </section>
  );
};
