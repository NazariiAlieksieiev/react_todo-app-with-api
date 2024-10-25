/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import cn from 'classNames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { UserWarning } from './UserWarning';
import {
  addTodo,
  deleteTodo,
  editTodo,
  getTodos,
  toggleTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList/TodoList';

enum ErrorMessage {
  load = 'Unable to load todos',
  title = 'Title should not be empty',
  add = 'Unable to add a todo',
  delete = 'Unable to delete a todo',
  update = 'Unable to update a todo',
}

enum Status {
  all = 'all',
  active = 'active',
  completed = 'completed',
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);
  const [status, setStatus] = useState(Status.all);
  const [selectedTodoId, setSelectedTodoId] = useState<number[]>([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isFailed, setIsFailed] = useState(false);
  const titleField = useRef<HTMLInputElement>(null);

  const todosCounter = useMemo(() => {
    const notCompletedTodos = todos.filter(todo => !todo.completed).length;
    const message =
      notCompletedTodos === 1
        ? `${notCompletedTodos} item left`
        : `${notCompletedTodos} items left`;

    return message;
  }, [todos]);
  const completedTodos = useMemo(() => {
    const completed = todos.filter(todo => todo.completed).length;

    return completed;
  }, [todos]);
  const hasError = useMemo(() => !Boolean(errorMessage), [errorMessage]);
  const isActiveButton = useCallback(
    (value: string) => value === status,
    [status],
  );

  const onAutoCloseNotification = useCallback(() => {
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000);
  }, []);
  const onCloseNotification = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setErrorMessage(null);
    },
    [],
  );

  const onSetStatus = useCallback((event: React.MouseEvent) => {
    const a = event.target as HTMLAnchorElement;
    const statusValue =
      (a.getAttribute('href')?.replace('#/', '') as Status) || Status.all;

    setStatus(statusValue);
  }, []);

  const visibleTodos = useMemo(() => {
    switch (status) {
      case Status.all:
        return todos;
      case Status.active:
        return todos.filter(todo => !todo.completed);
      case Status.completed:
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [status, todos]);

  const handleNewTodoForm = (event: React.FormEvent) => {
    event.preventDefault();

    if (isProcessing) {
      return;
    }

    if (!todoTitle.trim()) {
      setErrorMessage(ErrorMessage.title);
      setTodoTitle('');
      onAutoCloseNotification();

      return;
    }

    setTempTodo({ title: todoTitle, userId: USER_ID, id: 0, completed: false });

    setIsProcessing(true);

    addTodo(todoTitle.trim())
      .then(newTodo => {
        setTodos(prev => [...prev, newTodo as Todo]);
        setTodoTitle('');
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.add);
        onAutoCloseNotification();
      })
      .finally(() => {
        setIsProcessing(false);
        setTempTodo(null);
      });
  };

  const handleClearCompleted = async () => {
    const completedIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);
    const toDeleteTodo: number[] = [];

    setSelectedTodoId(completedIds);

    try {
      await Promise.all(
        completedIds.map(async id => {
          try {
            await deleteTodo(id);
            toDeleteTodo.push(id);
          } catch (error) {
            setErrorMessage(ErrorMessage.delete);
            onAutoCloseNotification();
          }
        }),
      );
      setTodos(prevTodos =>
        prevTodos.filter(todo => !toDeleteTodo.includes(todo.id)),
      );
    } catch {
      setErrorMessage(ErrorMessage.delete);
      onAutoCloseNotification();
    } finally {
      setSelectedTodoId([]);
    }
  };

  const handleDeleteTodo = (todoId: number) => {
    setSelectedTodoId([todoId]);

    deleteTodo(todoId)
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
        setSelectedTodoId([]);
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.delete);
        onAutoCloseNotification();
      })
      .finally(() => {
        setSelectedTodoId([]);
      });
  };

  const handleToggleTodo = async (id: number, index: number) => {
    const toToggleTodo = todos.find(todo => todo.id === id);

    if (!toToggleTodo) {
      return;
    }

    const { completed } = toToggleTodo;

    try {
      setIsProcessing(true);
      setSelectedTodoId([id]);
      const updatedTodo = await toggleTodo(id, completed);

      setTodos(prev => {
        const newTodos = [...prev];

        newTodos.splice(index, 1, updatedTodo as Todo);

        return newTodos;
      });
    } catch {
      setErrorMessage(ErrorMessage.update);
    } finally {
      setIsProcessing(false);
      onAutoCloseNotification();
      setSelectedTodoId([]);
    }
  };

  const handleToggleAll = async () => {
    const toToggleIds: number[] = [];
    const isAllCompleted = todos.every(todo => todo.completed === true);

    setIsProcessing(true);

    if (isAllCompleted) {
      try {
        await Promise.all(
          todos.map(async todo => {
            try {
              await toggleTodo(todo.id, todo.completed);
              toToggleIds.push(todo.id);
            } catch {
              setErrorMessage(ErrorMessage.update);
              onAutoCloseNotification();
            }
          }),
        );

        setTodos(prev => {
          const newTodos = prev.map(todo => ({
            ...todo,
            completed: !todo.completed,
          }));

          return newTodos;
        });
      } catch {
        setErrorMessage(ErrorMessage.update);
        onAutoCloseNotification();
      } finally {
        setIsProcessing(false);
      }
    } else {
      try {
        await Promise.all(
          todos.map(async (todo, i) => {
            if (todo.completed === false) {
              handleToggleTodo(todo.id, i);
            }
          }),
        );
      } catch {
        setErrorMessage(ErrorMessage.update);
        onAutoCloseNotification();
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStartEdit = (prevTitle: string, id: number) => {
    if (isFailed) {
      return;
    }

    setIsEditing(id);
    setNewTodoTitle(prevTitle);
  };

  const handleEditTitle = async (
    event: React.FormEvent,
    todo: Todo,
    index: number,
  ) => {
    event.preventDefault();

    const { title, id } = todo;

    if (title === newTodoTitle) {
      setIsEditing(null);
      setNewTodoTitle('');

      return;
    }

    if (!newTodoTitle.trim()) {
      handleDeleteTodo(id);

      return;
    }

    try {
      setSelectedTodoId([id]);

      const updatedTodo = await editTodo(id, newTodoTitle.trim());

      setTodos(prev => {
        const newTodos = [...prev];

        newTodos.splice(index, 1, updatedTodo as Todo);

        return newTodos;
      });

      setNewTodoTitle('');
      setIsEditing(null);
      setIsFailed(false);
    } catch {
      setErrorMessage(ErrorMessage.update);
      onAutoCloseNotification();
      setIsFailed(true);
    } finally {
      setSelectedTodoId([]);
    }
  };

  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsEditing(null);
      setNewTodoTitle('');
    }
  };

  useEffect(() => {
    const currentField = titleField.current;

    if (currentField !== null) {
      currentField.focus();
    }
  }, [titleField, todos, tempTodo]);

  useEffect(() => {
    const isAllCompleted = todos.every(todo => todo.completed === true);

    if (isAllCompleted && todos.length > 0) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [todos]);

  useEffect(() => {
    getTodos()
      .then(downloadedTodos => {
        setTodos(downloadedTodos);
        setIsProcessing(true);
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.load);
        onAutoCloseNotification();
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, []);
  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              type="button"
              className={cn('todoapp__toggle-all', { active: isActive })}
              data-cy="ToggleAllButton"
              onClick={handleToggleAll}
            />
          )}

          <form onSubmit={handleNewTodoForm}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onChange={event => setTodoTitle(event.target.value)}
              value={todoTitle}
              ref={titleField}
              disabled={isProcessing}
            />
          </form>
        </header>

        <TodoList
          todos={visibleTodos}
          selectedTodoId={selectedTodoId}
          tempTodo={tempTodo}
          isEditing={isEditing}
          newTitle={newTodoTitle}
          onDelete={handleDeleteTodo}
          onToggle={handleToggleTodo}
          onStartEditing={handleStartEdit}
          onNewTodoTitle={setNewTodoTitle}
          onChangeTodoTitle={handleEditTitle}
          onKey={handleKey}
        />

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {todosCounter}
            </span>

            <nav className="filter" data-cy="Filter" onClick={onSetStatus}>
              <a
                href="#/"
                className={cn('filter__link', {
                  selected: isActiveButton(Status.all),
                })}
                data-cy="FilterLinkAll"
              >
                All
              </a>

              <a
                href={`#/${Status.active}`}
                className={cn('filter__link', {
                  selected: isActiveButton(Status.active),
                })}
                data-cy="FilterLinkActive"
              >
                Active
              </a>

              <a
                href={`#/${Status.completed}`}
                className={cn('filter__link', {
                  selected: isActiveButton(Status.completed),
                })}
                data-cy="FilterLinkCompleted"
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={handleClearCompleted}
              disabled={completedTodos === 0}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: hasError },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={onCloseNotification}
        />
        {errorMessage}
      </div>
    </div>
  );
};
