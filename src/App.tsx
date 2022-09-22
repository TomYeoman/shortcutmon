import React, { useEffect, useState } from "react";
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import "reflect-metadata";
import { Connection, createConnection, getRepository } from "typeorm";

import ConnectionObject from "./utils/connectionObject";
import Shortcuts from "./components/Shortcuts";
import AddShortcut from "./components/AddShortcut";
import GraphBreakdown from "./components/GraphBreakdown";
import { ShortcutCompletionRecord } from "./entities/ShortcutCompletionRecord";
import { ShortcutReminderRecord } from "./entities/ShortcutReminderRecord";
import { Shortcut } from "./entities/Shortcut";
import { sendAsyncMessageToServer } from "./message-control/renderer";
import { convertBoolToInt, convertIntToBool } from "./utils/utils";
import { FETCH_SHORTCUTS } from "./message-control/messages";

function App() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);

  const history = useHistory();
  const location = useLocation();

  // Fetch all shortcuts from the database
  const fetchShortcuts = async () => {
    const shortcuts = await getRepository(Shortcut).find();
    setShortcuts(shortcuts);
  };

  // On first render, connect to the database
  useEffect(() => {
    async function setupConnection() {
      try {
        const connection = await createConnection(ConnectionObject);
        setConnection(connection);
        fetchShortcuts();
      } catch (error) {
        console.log(error);
      }

      return () => {};
    }
    setupConnection();
  }, []);

  React.useEffect(() => {
    // Reload shortcuts on initial load, then every navigate back to the main page
    if (connection) {
      fetchShortcuts();
    } else {
      console.log("WAITING FOR CONNECTION BEFORE FETCHING SHORTCUTS");
    }
  }, [location]);

  const handleClickDeleteKeyCombination = async (id: string) => {
    // Delete all associated shortcut completion records
    await getRepository(ShortcutCompletionRecord).delete({
      shortcut: { id: parseInt(id) },
    });
    await getRepository(ShortcutReminderRecord).delete({
      shortcut: { id: parseInt(id) },
    });

    // delete record from shortcut DB
    await getRepository(Shortcut).delete(parseInt(id));

    // Update the cache in both the front, and backend.
    sendAsyncMessageToServer(FETCH_SHORTCUTS);
    fetchShortcuts();
  };

  const handleUpdateEnabledStatus = async (id: string) => {
    const shortcut = await getRepository(Shortcut).findOne(parseInt(id));

    if (!shortcut) {
      console.log("Shortcut not found");
      return;
    }

    let currentState = convertIntToBool(shortcut.enabled);
    shortcut.enabled = convertBoolToInt(!currentState);
    await getRepository(Shortcut).save(shortcut);

    // Update the cache in both the front, and backend.
    sendAsyncMessageToServer(FETCH_SHORTCUTS);
    fetchShortcuts();
  };

  const handleClickEditShortcut = async (id: string) => {
    const shortcut = await getRepository(Shortcut).findOne(parseInt(id));

    if (!shortcut) {
      console.log("Shortcut not found");
      return;
    }

    history.push(`/new_shortcut/${id}`);
  };

  const handleClickSaveNewShortcut = async (shortcut: Shortcut) => {
    try {
      await getRepository(Shortcut).save(shortcut);
      history.push("/");

      // Update the cache in both the front, and backend.
      sendAsyncMessageToServer(FETCH_SHORTCUTS);
      fetchShortcuts();
    } catch (e) {
      console.log(e);
    }
  };

  if (!connection) {
    return <div>Waiting for connection</div>;
  }

  return (
    <div id="app" className="bg-slate-800 w-full h-screen">
      <div className="container mx-auto flex-grow-1 p-5">
        <Switch>
          <Route
            path="/"
            exact
            render={(props) => (
              <Shortcuts
                {...props}
                shortcuts={shortcuts}
                handleClickDeleteKeyCombination={
                  handleClickDeleteKeyCombination
                }
                handleUpdateEnabledStatus={handleUpdateEnabledStatus}
                handleClickEditShortcut={handleClickEditShortcut}
              />
            )}
          />
          <Route path="/shortcuts" exact component={Shortcuts} />
          <Route
            path="/new_shortcut"
            exact
            render={(props) => (
              <AddShortcut
                {...props}
                handleClickSaveNewShortcut={handleClickSaveNewShortcut}
              />
            )}
          />
          <Route
            path="/new_shortcut/:id"
            exact
            render={(props) => (
              <AddShortcut
                {...props}
                handleClickSaveNewShortcut={handleClickSaveNewShortcut}
              />
            )}
          />
          <Route
            path="/graph_breakdown/:id"
            exact
            render={(props) => (
              <GraphBreakdown {...props} connection={connection} />
            )}
          />
        </Switch>
      </div>
    </div>
  );
}

export default App;
